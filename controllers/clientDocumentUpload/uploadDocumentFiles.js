import { asyncHandler } from "../../middlewares/asyncHandler.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils.js";
import clientDocRepository from "../../repositories/clientDocRepository.js";
import clientProfileRepository from "../../repositories/clientProfileRepository.js";
import heicConvert from "heic-convert";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_IAM_ACCESS_KEY,
    secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
  },
});
export const getS3FileUrl = (bucketName, fileKey) => {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};
const convertHeicToJpg = async (filePath) => {
  try {
    const inputBuffer = await fs.promises.readFile(filePath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9,
    });

    const newFilePath = filePath.replace(/\.heic$/i, ".jpg");
    await fs.promises.writeFile(newFilePath, outputBuffer);

    // Unlink the original HEIC file
    await fs.promises.unlink(filePath);

    return {
      success: true,
      newFilePath,
      originalPath: filePath,
    };
  } catch (error) {
    console.error("Error converting HEIC to JPG:", error);
    throw new Error("Failed to convert HEIC to JPG");
  }
};
export const safeUnlink = async (filePath) => {
  try {
    await fs.promises.access(filePath); // Check if the file exists
    await fs.promises.unlink(filePath); // Attempt to delete the file
    // console.log(`Successfully deleted: ${filePath}`);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn(`File not found: ${filePath}`); // File does not exist
    } else {
      console.error(`Error deleting file: ${err.message}`); // Other errors
    }
  }
};
export const uploadToS3 = async (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }

  let finalPath = filePath;
  let fileContent;
  let isHeic = false;

  if (path.extname(filePath).toLowerCase() === ".heic") {
    isHeic = true;
    const conversionResult = await convertHeicToJpg(filePath);
    finalPath = conversionResult.newFilePath;
  }

  fileContent = await fs.promises.readFile(finalPath);
  const ext = path.extname(finalPath).toLowerCase();
  let contentType;
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".gif":
      contentType = "image/gif";
      break;
    case ".bmp":
      contentType = "image/bmp";
      break;
    case ".pdf":
      contentType = "application/pdf";
      break;
    default:
      contentType = "application/octet-stream";
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path.basename(finalPath),
    Body: fileContent,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(params);

  try {
    const data = await s3Client.send(command);

    if (isHeic) {
      await safeUnlink(finalPath);
    }
    // console.log(data)
    return data;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};
export const uploadDocFiles = asyncHandler(async (req, res) => {
  const { userId, documentType, permission } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.error("Please upload at least one file!", 400);
  }
  const { _id, adminId } = req.user;
  const fileCount = req.files.length;
  const processingFiles = fileCount === 1 ? [req.files[0]] : req.files;
  const uploadResults = [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clientData = await clientProfileRepository.getClientById(_id);

    if (
      documentType === "IDENTITY_PROOF" &&
      clientData.KYCVerification.verificationDocUploaded
    ) {
      throw new Error("Identity documents are already uploaded");
    }

    if (
      documentType === "ADDRESS_PROOF" &&
      clientData.KYCVerification.resedentialDocUploaded
    ) {
      throw new Error("Residential documents are already uploaded");
    }

    for (const document of processingFiles) {
      const s3Response = await uploadToS3(document.path);
      const s3FileUrl = getS3FileUrl(
        process.env.AWS_BUCKET_NAME,
        document.filename
      );

      const newDoc = {
        userId: new mongoose.Types.ObjectId(_id),
        adminId: new mongoose.Types.ObjectId(adminId),
        documentType: documentType || "unknown",
        documentName: req.body.documentName || "unknown",
        documentId: req.body.documentNumber || "unknown",
        dateOfExpiry: req.body.documentExpiryDate
          ? new Date(req.body.documentExpiryDate)
          : new Date(),
        country: req.body.country || "unknown",
        address: req.body.address || "unknown",
        postalCode: req.body.postalCode || "unknown",
        state: req.body.state || "unknown",
        fileDetails: {
          file: {
            originalName: document.originalname,
            fileName: document.filename,
            fileType: document.mimetype,
            fileSize: document.size,
            s3Path: s3FileUrl,
            mimeType: document.mimetype,
            s3Tag: s3Response.ETag,
          },
        },
        status: "PENDING",
        verificationDetails: {
          verifiedBy: null,
          remarks: "Pending verification",
        },
        createdAt: getUTCTime(),
        updatedAt: getUTCTime(),
      };

      const saveClientDocData = await clientDocRepository.createClientDocTran(
        newDoc,
        session
      );

      if (!saveClientDocData) {
        throw new Error("Error Occurred While Uploading Document");
      }

      const client = await clientProfileRepository.getClientByIdTran(
        _id,
        "",
        session
      );
      if (!client) {
        throw new Error("Client not found");
      }

      if (!client.KYCVerification) {
        client.KYCVerification = {
          docUploadPermission: {},
          verificationDocUploadPermission: false,
          resedentialDocUploaded: false,
        };
      }

      if (documentType === "IDENTITY_PROOF") {
        client.KYCVerification.docUploadPermission.verificationDocUploadPermission =
          permission === true || permission === "true";
        client.KYCVerification.verificationDocUploaded = true;
      }

      if (documentType === "ADDRESS_PROOF") {
        client.KYCVerification.docUploadPermission.resedentialDocUploadPermission =
          permission === true || permission === "true";
        client.KYCVerification.resedentialDocUploaded = true;
      }

      await client.save({ session });
      await safeUnlink(document.path);

      uploadResults.push(saveClientDocData);

      if (fileCount === 1) break;
    }

    await session.commitTransaction();
    session.endSession();

    return res.success(
      fileCount === 1 ? uploadResults[0] : uploadResults,
      "Upload Success",
      200
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error during upload process:", error);
    return res.error(
      error.message || "An error occurred during the upload process",
      500
    );
  }
});

export const updateClientDocStatus = asyncHandler(async (req, res) => {
  const { userId, status, fileNumber } = req.body;
  const clientDocs = await clientDocRepository.findClientDocByField(
    userId,
    fileNumber
  );
  if (!clientDocs || clientDocs.length !== 1) {
    return res.error("Error Occurred While Updating Status", 500);
  }
  const clientDoc = clientDocs[0];
  clientDoc.status = status ? status : clientDoc.status;
  await clientDoc.save();
  // console.log(clientDoc);
  return res.success({}, "update Success!", 200);
});
export const getClientDocFilesDownload = asyncHandler(async (req, res) => {
  const docId = req.user.id;
  const { _id: specificDocId } = req?.body;

  if (!docId) {
    return res.error("UserId is required", 400);
  }

  const clientDoc = await clientDocRepository.findClientDocByField(docId);

  if (!clientDoc) {
    return res.error("Document not found for this user", 404);
  }

  const supportedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  let filteredDocs = [];

  if (specificDocId) {
    // Case 1: When _id is provided, return only the image URL for viewing
    filteredDocs = clientDoc.filter(
      (doc) =>
        doc._id.toString() === specificDocId.toString() &&
        supportedMimeTypes.includes(doc.fileDetails.file.mimeType)
    );

    if (filteredDocs.length === 0) {
      return res.success([], "No image document found with the specified ID");
    }
    const doc = filteredDocs[0];
    const fileName = doc.fileDetails.file.s3Path;
    if (!fileName) {
      return res.error("No file available for this document", 404);
    }

    // const downloadParams = {
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: fileName,
    //   ResponseContentType: doc.fileDetails.file.mimeType,
    // };

    // const signedUrl = await getSignedUrl(
    //   s3Client,
    //   new GetObjectCommand(downloadParams),
    //   { expiresIn: 3600 }
    // );

    return res.success(
      { imageUrl: fileName },
      "Image URL retrieved successfully",
      200
    );
  } else {
    filteredDocs = clientDoc.filter((doc) =>
      supportedMimeTypes.includes(doc.fileDetails.file.mimeType)
    );

    if (filteredDocs.length === 0) {
      return res.success([], "No image documents found");
    }

    const results = await Promise.all(
      filteredDocs.map(async (doc) => {
        const fileName = doc?.fileDetails?.file?.s3Path;

        if (!fileName) return null;

        // const downloadParams = {
        //   Bucket: process.env.AWS_BUCKET_NAME,
        //   Key: fileName,
        //   ResponseContentDisposition: `attachment; filename="${fileName}"`,
        //   ResponseContentType: doc.fileDetails.file.mimeType,
        // };

        // const signedUrl = await getSignedUrl(
        //   s3Client,
        //   new GetObjectCommand(downloadParams),
        //   { expiresIn: 3600 }
        // );

        return {
          _id: doc._id,
          fileName: fileName,
          fileType: doc.fileDetails.file.mimeType,
          fileNumber: doc.documentNumber,
          documentName: doc.documentName,
          documentType: doc.documentType,
          status: doc.status,
          downloadUrl: fileName,
        };
      })
    );

    const validFileLinks = results.filter(Boolean);

    if (validFileLinks.length === 0) {
      return res.success([], "No valid image files available for download");
    }

    return res.success(
      { documents: validFileLinks },
      "Retrieved Image Links Successfully",
      200
    );
  }
});
export const removeUploadedFileDoc = asyncHandler(async (req, res) => {
  const { fileName, id } = req.body;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  };
  const command = new DeleteObjectCommand(params);
  await s3Client
    .send(command)
    .then(async (result) => {
      console.log("File deleted successfully", result.$metadata.httpStatusCode);
      if (result?.$metadata?.httpStatusCode === 204) {
        await clientDocRepository
          .deleteClientDocById(id)
          .then((result) => {
            return res.success({}, "Client document deleted successfully");
          })
          .catch((err) => {
            throw new Error(err.message);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.error(`Error Occurred While Deletion From S3: ${err.message}`, 400);
    });
});
export const interRemoveDocs = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { docArray } = req.body;
  const promises = docArray.map((docId) => {
    return clientDocRepository?.updateClientDocById(
      new mongoose.Types.ObjectId(docId),
      { $set: { isActive: false } }
    );
  });
  await Promise.all(promises);
  return res.success({}, "Document Updated");
});
