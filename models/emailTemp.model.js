import mongoose from 'mongoose';

const emailTempSchema = new mongoose.Schema(
  {
    whitelabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Whitelabel',
    },
    emailBody: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    variables: {
      type: Object,
      required: true,
      default: {},
    },
    from: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    collection: 'emailTemplates',
  }
);

// Export the model
export default mongoose.model('emailTemplate', emailTempSchema);
