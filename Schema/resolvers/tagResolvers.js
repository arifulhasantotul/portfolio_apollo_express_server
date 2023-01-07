const models = require("../../models");

const tagResolvers = {
  Query: {
    listTag: async (parent, args, context) => {
      return await models.DB_Tag.find({});
    },
    getTag: async (parent, args, context) => {
      return await models.DB_Tag.findById(args.id);
    },
  },

  // POPULATE: getting population data using  graphQL query
  Tag: {
    projects: async (parent, args, context) => {
      return await models.DB_Project.find({ _id: { $in: parent.projectsId } });
    },
  },

  Mutation: {
    createTag: async (parent, args, context) => {
      const newTag = new models.DB_Tag({
        name: args.input.name,
      });
      return await newTag.save();
    },
    updateTag: async (parent, args, context) => {
      const updateTag = new models.DB_Tag({
        _id: args.id,
        name: args.input.name,
      });
      return await models.DB_Tag.findOneAndUpdate({ _id: args.id }, updateTag, {
        new: true,
      });
    },
    deleteTag: async (parent, args, context) => {
      return await models.DB_Tag.findByIdAndDelete(args.id);
    },
  },
};

module.exports = tagResolvers;
