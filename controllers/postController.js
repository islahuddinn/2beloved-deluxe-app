const Comment = require("../models/commentModel");
const Hide = require("../models/hideModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { PostCheckSingle, PostChecksArray } = require("../utils/helpers");
const { locationQuery } = require("../utils/geoLocationQuery");
const paginationQueryExtracter = require("../utils/paginationQueryExtractor");
const factory = require("./handleFactory");
const Follow = require("../models/friendsModel");
const paginateArray = require("../utils/paginationHelper");

exports.createPostAdmin = catchAsync(async (req, res, next) => {
  const { content, text, tags, location } = req.body;
  const user = await User.findById(req.user.id).select("preferences");
  let post = await Post.create({
    content,
    text,
    tags,
    location,
    isAdmin: req.user.role === "admin" ? true : false,
    preferences: user?.preferences,
    creator: req.user.id,
  });
  post = await Post.findById(post._id);
  post = await PostCheckSingle(req.user.id, JSON.parse(JSON.stringify(post)));
  return res.status(201).json({
    status: 201,
    success: true,
    message: "Post Created Succesfully",
    post,
  });
});

exports.createPost = catchAsync(async (req, res, next) => {
  const { content, text, tags, location } = req.body;
  const user = await User.findById(req.user.id);
  let post = await Post.create({
    content,
    text,
    tags,
    location,
    creator: req.user.id,
  });
  post = await Post.findById(post._id);
  post = await PostCheckSingle(req.user.id, JSON.parse(JSON.stringify(post)));
  return res.status(201).json({
    status: 201,
    success: true,
    message: "Post Created Succesfully",
  });
});

exports.getUserposts = catchAsync(async (req, res, next) => {
  req.query.creator = req.params.id;

  data = await paginationQueryExtracter(req, Post, null);
  const posts = await PostChecksArray(
    req.user.id,
    req.user.name,
    JSON.parse(JSON.stringify(data.data))
  );

  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: posts,
      totalPages: data.totalPages,
    },
  });
});
exports.getAllPosts = catchAsync(async (req, res, next) => {
  // Extract query parameters from the request
  const { limit, page, creator } = req.query;

  // Define the condition for filtering posts based on creator
  const condition = creator ? { creator } : {};

  try {
    // Use the paginationQueryExtracter function to retrieve paginated posts data
    const { data, totalPages, totalavailables } =
      await paginationQueryExtracter(req, Post, condition);

    // Return the paginated posts data in the response
    res.status(200).json({
      status: "success",
      message: "Posts retrieved successfully",
      results: data.length,
      data: {
        posts: data,
        totalPages,
        totalPosts: totalavailables,
      },
    });
  } catch (error) {
    // Handle any errors that occur during the retrieval process
    console.error("Error retrieving posts:", error);
    res.status(500).json({
      status: "error",
      message: "Error retrieving posts",
      error: error.message,
    });
  }
});

exports.getOnePost = catchAsync(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("Post not found", 400));
  post = await PostCheckSingle(req.user.id, JSON.parse(JSON.stringify(post)));
  return res.status(201).json({
    status: 201,
    success: true,
    message: "Post Fetched Succesfully",
    post,
  });
});

// exports.nearbyPosts = catchAsync(async (req, res, next) => {
//   let hiddenPosts = await Hide.find({ creator: req.user.id });
//   hiddenPosts = hiddenPosts.map((post) => post.hide);

//   let km = req.query.km;
//   if (!km) km = 4;
//   let condition;
//   let data;
//   let location;
//   if (req.query.location) {
//     // location = {
//     //   $or: [
//     //     {
//     //       location: locationQuery(
//     //         req.query.location.split(",")[0],
//     //         req.query.location.split(",")[1],
//     //         km
//     //       ),
//     //     },
//     //   ],
//     // };
//     const centerPoint = [
//       Number(req.query.location.split(",")[0]),
//       Number(req.query.location.split(",")[1]),
//     ];
//     const maxDistance = km / 111; // 1 degree is approximately 111 kilometers

//     const boundingBox = {
//       minLon: centerPoint[0] - maxDistance,
//       maxLon: centerPoint[0] + maxDistance,
//       minLat: centerPoint[1] - maxDistance,
//       maxLat: centerPoint[1] + maxDistance,
//     };

//     location = {
//       location: {
//         $geoWithin: {
//           $box: [
//             [boundingBox.minLon, boundingBox.minLat],
//             [boundingBox.maxLon, boundingBox.maxLat],
//           ],
//         },
//       },
//     };

//     console.log(location.location.$geoWithin.$box);
//   }
//   condition = {
//     $or: [
//       { isAdmin: true },
//       {
//         $and: [
//           {
//             _id: {
//               $nin: hiddenPosts,
//             },
//           },
//           {
//             isAdmin: false,
//           },
//           {
//             creator: { $ne: req.user.id },
//           },
//           { ...location },
//         ],
//       },
//     ],
//   };
//   console.log(condition.$or[1].$and[3].location.$geoWithin.$box);
//   req.query.km = undefined;
//   req.query.location = undefined;
//   data = await paginationQueryExtracter(req, Post, condition);
//   const posts = await PostChecksArray(
//     req.user.id,
//     JSON.parse(JSON.stringify(data.data))
//   );
//   res.json({
//     status: 200,
//     success: true,
//     message: "Data Retrieved Successfully",
//     results: data.data.length,
//     data: {
//       data: posts,
//       totalPages: data.totalPages,
//     },
//   });
// });

exports.nearbyPosts = catchAsync(async (req, res, next) => {
  let hiddenPosts = await Hide.find({ creator: req.user.id });
  hiddenPosts = hiddenPosts.map((post) => post.hide);
  let km = req.query.km;
  if (!km) km = 4;
  let condition;
  let data;
  let location;
  if (req.query.location) {
    location = {
      $or: [
        {
          location: locationQuery(
            req.query.location.split(",")[0],
            req.query.location.split(",")[1],
            km
          ),
        },
      ],
    };
  }
  condition = {
    $and: [
      {
        _id: {
          $nin: hiddenPosts,
        },
      },
      {
        isAdmin: false,
      },
      {
        creator: { $ne: req.user.id },
      },
      { ...location },
    ],
  };
  // console.log(condition);
  req.query.km = undefined;
  req.query.location = undefined;
  data = await Post.find(condition);
  // data = JSON.parse(JSON.stringify(data));
  data = paginateArray(
    JSON.parse(JSON.stringify(data))
      .concat(
        JSON.parse(
          JSON.stringify(
            await Post.find({
              isAdmin: true,
              _id: {
                $nin: hiddenPosts,
              },
            })
          )
        )
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    req.query.page,
    req.query.limit
  );
  // data = paginateArray(data, req.query.page, req.query.limit);

  const posts = await PostChecksArray(
    req.user.id,
    JSON.parse(JSON.stringify(data.pageData))
  );
  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: posts.length,
    data: {
      data: posts,
      totalPages: data.totalPages,
    },
  });
});

exports.explorePosts = catchAsync(async (req, res, next) => {
  let followings = await Follow.find({ creator: req.user.id });
  followings = followings.map((follow) => follow.following._id);

  let hiddenPosts = await Hide.find({ creator: req.user.id });
  hiddenPosts = hiddenPosts.map((post) => post.hide);

  const user = await User.findById(req.user.id).select("preferences");
  let condition;
  let data;
  condition = {
    $and: [
      {
        _id: {
          $nin: hiddenPosts,
        },
      },
      {
        $or: [
          {
            creator: {
              $in: followings,
            },
          },
          {
            $and: [
              { preferences: { $in: [...user.preferences] } },
              {
                creator: {
                  $in: followings,
                },
              },
            ],
          },
        ],
      },
      {
        isAdmin: false,
      },
      {
        creator: { $ne: req.user.id },
      },
    ],
  };
  // console.log("Cond", condition);
  data = await paginationQueryExtracter(req, Post, condition);
  const posts = await PostChecksArray(
    req.user.id,
    JSON.parse(JSON.stringify(data.data))
  );
  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: posts,
      totalPages: data.totalPages,
    },
  });
});

exports.updatePost = factory.updateOne(Post);
// exports.getallPost = factory.getAll(Post);
exports.deletePost = factory.deleteOne(Post);

exports.hidePost = catchAsync(async (req, res, next) => {
  const hideId = req.params.id;
  const userId = req.user.id;

  const preHide = await Hide.findOne({
    $and: [{ creator: userId }, { hide: hideId }],
  });

  if (preHide) {
    await Hide.findByIdAndDelete(preHide._id);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Unhid Successfully",
    });
  } else {
    await Hide.create({ creator: userId, hide: hideId });

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Hid Successfully",
    });
  }
});
