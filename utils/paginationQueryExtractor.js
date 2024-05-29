const APIFeatures = require("../utils/apiFeatures");

const paginationQueryExtracter = async (req, model, condition) => {
  let data = [];
  let totalPages;

  req.query.limit = req.query.limit || 1000000000000000;
  req.query.page = req.query.page || 1;

  let totalavailables;

  if (model.modelName === 'Post') {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: condition || {} },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
      { $addFields: { isBoostActive: '$creator.boost.isBoostActive' } },
      { $sort: { isBoostActive: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    data = await model.aggregate(pipeline);
     totalavailables = await model.countDocuments(condition);
    totalPages = Math.ceil(totalavailables / limit);
  } else {
    const features = new APIFeatures(model.find(condition), req.query)
      .filter()
      .sorting()
      .field()
      .paging();
    data = await features.query;
    const countfeatures = new APIFeatures(model.find(condition), req.query)
      .filter()
      .field();
     totalavailables = (await countfeatures.query).length;
    totalPages = Math.ceil(totalavailables / (req.query.limit * 1));
  }

  return {
    data,
    totalPages,
    totalavailables,
  };
};

module.exports = paginationQueryExtracter;
