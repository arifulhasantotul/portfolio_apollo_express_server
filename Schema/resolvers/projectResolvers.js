const models = require("../../models");

const projectResolvers = {
  Query: {
    listProject: async (parent, args, context) => {
      return await models.DB_Project.find({});
    },
    getProject: async (parent, args, context) => {
      return await models.DB_Project.findById(args.id);
    },
    getProjectBySlug: async (parent, args, context) => {
      return await models.DB_Project.find({ slug: args.slug });
    },
  },

  // POPULATE: getting population data using  graphQL query
  Project: {
    categories: async (parent, args, context) => {
      return await models.DB_Category.find({
        _id: { $in: parent.categoriesId },
      });
    },
    tags: async (parent, args, context) => {
      return await models.DB_Tag.find({ _id: { $in: parent.tagsId } });
    },
    client: async (parent, args, context) => {
      return await models.DB_People.findById(parent.clientId);
    },
  },

  Mutation: {
    createProject: async (parent, args, context) => {
      const newProject = new models.DB_Project({
        name: args.input.name,
        slug: args.input.slug,
        categoriesId: args.input.categoriesId,
        des: args.input.des || "",
        tagsId: args.input.tagsId || null,
        status: args.input.status,
        rank: args.input.rank,
        ratings: args.input.ratings || null,
        clientId: args.input.clientId,
        live_site: args.input.live_site || "",
        client_repo: args.input.client_repo || "",
        server_repo: args.input.server_repo || "",
        thumb_img: args.input.thumb_img || "",
        sub_img: args.input.sub_img || null,
      });
      const project = await newProject.save();

      // NOTE: update category projectsId to get project data
      if (project?.categoriesId?.length > 0) {
        project.categoriesId.forEach(async (category_id) => {
          await models.DB_Category.updateOne(
            { _id: category_id },
            { $push: { projectsId: project._id } }
          );
        });
      }

      // NOTE: update category projectsId to get project data
      if (project?.tagsId?.length > 0) {
        project.tagsId.forEach(async (tag_id) => {
          await models.DB_Tag.updateOne(
            { _id: tag_id },
            { $push: { projectsId: project._id } }
          );
        });
      }

      return project;
    },
    updateProject: async (parent, args, context) => {
      const updateProjectInfo = new models.DB_Project({
        _id: args.id,
        name: args.input.name,
        slug: args.input.slug,
        categoriesId: args.input.categoriesId,
        des: args.input.des,
        tagsId: args.input.tagsId,
        rank: args.input.rank,
        ratings: args.input.ratings,
        status: args.input.status,
        clientId: args.input.clientId,
        live_site: args.input.live_site,
        client_repo: args.input.client_repo,
        server_repo: args.input.server_repo,
        thumb_img: args.input.thumb_img,
        sub_img: args.input.sub_img,
      });
      const updateProject = await models.DB_Project.findOneAndUpdate(
        { _id: args.id },
        updateProjectInfo,
        {
          new: true,
        }
      );

      // NOTE: update category projectsId to get updateProject data
      if (updateProject?.categoriesId?.length > 0) {
        updateProject.categoriesId.forEach(async (category_id) => {
          await models.DB_Category.updateOne(
            { _id: category_id },
            { $addToSet: { projectsId: updateProject._id } }
          );
        });
      }

      // NOTE: update tag projectsId to get updateProject data
      if (updateProject?.tagsId?.length > 0) {
        updateProject.tagsId.forEach(async (tag_id) => {
          await models.DB_Tag.updateOne(
            { _id: tag_id },
            { $addToSet: { projectsId: updateProject._id } }
          );
        });
      }

      return updateProject;
    },
    deleteProject: async (parent, args, context) => {
      const project = await models.DB_Project.findByIdAndDelete(args.id);
      // NOTE: removing projectsId from category
      if (project?.categoriesId?.length > 0) {
        project.categoriesId.forEach(async (category_id) => {
          await models.DB_Category.updateOne(
            { _id: category_id },
            { $pull: { projectsId: project._id } }
          );
        });
      }

      // NOTE: removing projectsId from tag
      if (project?.tagsId?.length > 0) {
        project.tagsId.forEach(async (tag_id) => {
          await models.DB_Tag.updateOne(
            { _id: tag_id },
            { $pull: { projectsId: project._id } }
          );
        });
      }

      return project;
    },
  },
};

module.exports = projectResolvers;
