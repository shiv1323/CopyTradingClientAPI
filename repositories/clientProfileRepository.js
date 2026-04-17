import clientProfile from "../models/clientProfile.model.js";

class ClientRepository {
  async findOrCreate(ctUserData) {
    const { email, whiteLabel } = ctUserData;
    
    // Find existing user
    const existingUser = await EndUser.findOne({
      email: email.toLowerCase().trim(),
      whiteLabel: whiteLabel,
      deletedAt: null
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
}

export default new ClientRepository();
