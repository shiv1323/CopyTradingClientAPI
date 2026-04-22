import clientModel from "../models/clientProfile.model.js";
import mongoose from "mongoose";
class ClientRepository {
    async create(data) {
    return await clientProfile.create(data);
  }

  async findOrCreate(ctUserData) {
    const { email, whiteLabel } = ctUserData;
    
    // Find existing user
    const existingUser = await clientProfile.findOne({
      email: email.toLowerCase().trim(),
      whiteLabel: whiteLabel,
    });

    if (existingUser) {
      // Update existing user with latest data
      const updateData = {};
      if (ctUserData.name) updateData.name = ctUserData.name;
      if (ctUserData.phoneNo) updateData.phoneNo = ctUserData.phoneNo;
      if (ctUserData.countryCode) updateData.countryCode = ctUserData.countryCode;
      if (ctUserData.country) updateData.country = ctUserData.country;

      if (Object.keys(updateData).length > 0) {
        return await this.update(existingUser._id, updateData);
      }
      
      return existingUser;
    }

    // Create new user
    return await this.create({
      email: email.toLowerCase().trim(),
      name: ctUserData.name || '',
      phoneNo: ctUserData.phoneNo || '',
      whiteLabel: whiteLabel,
      userId: ctUserData.userId || '',
      status: ctUserData.status || '',
      country: ctUserData.country || '',
      countryCode: ctUserData.countryCode || '',
      metadata: ctUserData.metadata || {},
      password : ctUserData.password || ""
    });
  }

  async update(ctUserId, updateData) {
  return await clientProfile.findByIdAndUpdate(
    ctUserId,
    updateData,
    { new: true }
  )
    .populate('whiteLabel', 'name website');
  }
  // Create a new client
  async createClient(clientData) {
    const client = new clientModel(clientData);
    if (!client.userId) {
      client.userId = await clientModel.generateUserName();
    }
    return await client.save();
  }
  // Find a client by email
  async findClientByEmail(userIdOrEmail) {
    const isNumber = !isNaN(userIdOrEmail);
    return await clientModel.findOne({
      $or: [
        { userId: isNumber ? Number(userIdOrEmail) : null },
        { email: isNumber ? null : userIdOrEmail.toLowerCase() },
      ].filter(Boolean),
    });
  }

  // Find a client by phone number
  async findClientByPhone(phoneNumber) {
    return await clientModel.findOne({
      phoneNo: phoneNumber,
    });
  }

  // Get a client by its ID
  async getClientById(clientId) {
    return await clientModel.findById(clientId);
  }

  // Get a client by its ID and session
  async getClientByIdSession(clientId, session, selectFields = "") {
    return await clientModel
      .findById(clientId)
      .select(selectFields)
      .session(session);
  }
  // Get a client by a unique key (e.g., email, phone number, etc.)
  // Get a client by a unique key (e.g., email, phone number, etc.)
    async getClientByUniqueKey(key, value) {
    const filter = { [key]: value };
    return await clientModel.findOne(filter);
  }

  // Get a client by a filter
  async getClientByFilter(filter, select = "") {
    return await clientModel.findOne(filter).select(select);
  }

  // Get all clients, optionally selecting specific fields
  async getAllClients(selectFields = "") {
    return await clientModel.find({}).select(selectFields);
  }

  // Get a client by its ID
  async getClientById(clientId, select = "") {
    return await clientModel
      .findOne({
        _id: clientId,
      })
      .select(select);
  }

  // Update a client by their ID
  async updateClientById(clientId, updates) {
    return await clientModel.findByIdAndUpdate(clientId, updates, {
      new: true,
    });
  }

  // Update a client by its ID and session
  async updateClientByIdSession(clientId, updates, session = null) {
    const options = { new: true };
    if (session) {
      options.session = session;
    }

    return await clientModel.findByIdAndUpdate(clientId, updates, options);
  }

  // Delete a client by their ID
  async deleteClientById(clientId) {
    return await clientModel.findByIdAndDelete(clientId);
  }

  // Update document by any field (e.g., email, phone number)
  async updateDocumentByField(fieldName, fieldValue, updateData) {
    const filter = { [fieldName]: fieldValue };
    return await clientModel.updateOne(filter, { $set: updateData });
  }

  // Get paginated clients based on filter, skip, and limit
  async getPaginatedClients(filter, skip, limit, select = "", sortOrder) {
    return await clientModel
      .find(filter)
      .select(select)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: sortOrder })
      .lean();
  }

  // Get filtered clients for download
  async getFilteredClientForDownload(filter, select = "", sortOrder) {
    return await clientModel
      .find(filter)
      .select(select)
      .sort({ createdAt: sortOrder })
      .lean();
  }

  // Get the count of clients matching a filter
  async getClientsCount(filter) {
    return await clientModel.countDocuments(filter).exec();
  }

  // Get all clients, sorted by a specific field
  async getFilteredAllClients(
    selectFields = "",
    sortField = "createdAt",
    sortOrder = 1,
  ) {
    return await clientModel
      .find({})
      .select(selectFields)
      .sort({ [sortField]: sortOrder });
  }

  // Get clients by account type, optionally selecting specific fields
  async getClientsByAccountType(accountType, selectFields = "") {
    return await clientModel.find({ accountType }).select(selectFields);
  }

  // Get a client by options
  async getClientByOptions(options, selectFields) {
    return await clientModel
      .find(options)
      .select(selectFields);
  }

  // Get a client by options paginated
  async getClientByOptionsPaginated(options, skip, limit, selectFields) {
    return await clientModel
      .find(options)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(selectFields)
      .lean();
  }

  async getClientByIdTran(clientId, selectFields = "", session = null) {
    const query = clientModel.findById(clientId).select(selectFields);
    if (session) {
      query.session(session);
    }
    return await query;
  }

  async updateOneRecord(filter, update) {
    return await clientModel.updateOne(filter, update);
  }

  async getClientGraphInfo(fromDate, toDate, filter) {
    const baseFilter = {
      // whiteLabel: whiteLabel,
      createdAt: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      },
      ...filter,
    };
    return await clientModel.aggregate([
      {
        $match: baseFilter,
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $group: {
          _id: null,
          dailyCounts: {
            $push: {
              date: "$_id",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          dailyCounts: 1,
          total: 1,
        },
      },
    ]);
  }

  async countRecordsByType(filter) {
    const [activeCount, notActiveCount] = await Promise.all([
      clientModel.countDocuments({
        ...filter,
        status: "active",
      }),
      clientModel.countDocuments({
        ...filter,
        status: { $ne: "active" },
      }),
    ]);

    return {
      notActive: notActiveCount,
      active: activeCount,
    };
  }

  async getWalletSumsByWhiteLabel(filter) {
    const result = await clientModel.aggregate([
      {
        $match: filter,
      },
      {
        $project: {
          _id: 0,
          ClientWallet: "$totalWalletBalance",
        },
      },
    ]);
    return result[0] || { ClientWallet: 0 };
  }

  async getAggregate(pipeline) {
    return await clientModel.aggregate(pipeline);
  }

  async getClientLastLogoutByClientType(clientId, iat, clientType) {
    const tokenPath =
      clientType === "WEB" ? "tokens.web" : "tokens.mobile";
  
    return await clientModel.findOne({
      _id: new mongoose.Types.ObjectId(clientId),
      status: "active",

      $or: [
        { [`${tokenPath}.lastLogoutAt`]: null },
        {
          [`${tokenPath}.lastLogoutAt`]: {
            $lt: new Date(iat * 1000),
          },
        },
      ],
    });
  }

  async updatesbswitch(clientId, updateData) {
    return await clientModel.findByIdAndUpdate(clientId, updateData, { new: true });
  }
}

export default new ClientRepository();
