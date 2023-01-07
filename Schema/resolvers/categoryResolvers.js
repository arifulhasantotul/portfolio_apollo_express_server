const models = require("../../models");

const categoryResolvers = {
  Query: {
    listCategory: async (parent, args, context) => {
      const categories = await models.DB_Category.find({});
      return categories;
    },

    getCategory: async (parent, args, context) => {
      const category = await models.DB_Category.findById(args?.id);
      return category;
    },
  },

  Category: {
    projects: async (parent, args, context) => {
      return await models.DB_Project.find({ _id: { $in: parent.projectsId } });
    },
  },

  Mutation: {
    createCategory: async (parent, args, context) => {
      const newCategory = new models.DB_Category({
        name: args.input.name,
      });
      return await newCategory.save();
    },
    updateCategory: async (parent, args, context) => {
      const updateCategory = new models.DB_Category({
        _id: args.id,
        name: args.input.name,
      });
      return await models.DB_Category.findOneAndUpdate(
        { _id: args.id },
        updateCategory,
        {
          new: true,
        }
      );
    },
    deleteCategory: async (parent, args, models) => {
      return await models.DB_Category.findByIdAndDelete(args.id);
    },
  },
};

module.exports = categoryResolvers;
