const Comment = require("../models/commentModel");
const Like = require("../models/likeModel");
const Hide = require("../models/hideModel");
const Post = require("../models/postModel");
const Block = require('../models/blockModel')
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
  //req.query.creator = req.params.id;
  const userId = req.params.id
  data = await paginationQueryExtracter(req, Post, null);
  const posts = await PostChecksArray(
    req.user.id,
    JSON.parse(JSON.stringify(data.data))
  );

  const userPosts = posts.filter((post)=>post.creator._id.toString() === userId.toString())

  res.json({
    status: 200,
    success: true,
    message: "Data Retrieved Successfully",
    results: data.data.length,
    data: {
      data: userPosts,
      totalPages: data.totalPages,
    },
  });
});
exports.getAllPosts = async (req, res, next) => {
  // Extract query parameters from the request
  console.log("HITTING API GET ALL POSTS")
  const userId = req.params.id;

  try {
    // Use the paginationQueryExtracter function to retrieve paginated posts data
    const data = await paginationQueryExtracter(req, Post, null);
    const posts = await PostChecksArray(
      userId,
      JSON.parse(JSON.stringify(data.data))
    );
    console.log("POSTS IN GET ALL POSTS ARE:", posts)
    // Return the paginated posts data in the response

    // posts.sort((a, b) => {
    //   const boostStatusA = a.creator.boost.isBoostActive;
    //   const boostStatusB = b.creator.boost.isBoostActive;
    //   return boostStatusB - boostStatusA; // Sort by boost status in descending order
    // });

    const blockedByUser = await Block.find({blockedBy: req.user._id})
    const blockedByOthers = await Block.find({blockedUser: req.user._id})

    if(!blockedByUser || !blockedByOthers){
      return next(new CustomError("Error fetching blocked users",400))
    }

    const blockedUsersIds = [
      ...blockedByUser.map((blockedDoc) => blockedDoc.blockedUser.toString()),
      ...blockedByOthers.map((blockedDoc) => blockedDoc.blockedBy.toString()),
    ];

    const filteredPosts = posts.filter((post)=> !blockedUsersIds.includes(post.creator._id.toString()))
    console.log("FILTERED POSTS ARE:", filteredPosts)
    res.status(200).json({
      status: 200,
      success: true,
      message: "Posts retrieved successfully",
      length: posts.length,
      data: {
        posts: filteredPosts,
        totalPages: data.totalPages,
      },
    });
  } catch (error) {
    // Handle any errors that occur during the retrieval process
    console.error("Error retrieving posts:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Error retrieving posts",
      error: error.message,
    });
  }
};

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
              { preferences: { $in: [...user.id] } },
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
// exports.search = catchAsync(async (req, res) => {
//   const { keywords } = req.query;

//   try {
//     // Search for posts containing the keywords in their content or title
//     const posts = await Post.find({
//       $or: [
//         { title: { $regex: keywords, $options: "i" } },
//         { "creator.name": { $regex: keywords, $options: "i" } },
//         { "creator.email": { $regex: keywords, $options: "i" } },
//       ],
//     });

//     return res.status(200).json({ success: true, posts });
//   } catch (error) {
//     // Handle errors
//     console.error("Error searching:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// });

exports.searchPosts = catchAsync(async (req, res, next) => {
  // Extract the search keyword from the query string
  const keyword = req.query.search;

  try {
    // Search for users based on the name or email
    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    });

    // Extract the user IDs from the found users
    const userIds = users.map((user) => user._id);

    const posts = await Post.find({
      $or: [
        { text: { $regex: keyword, $options: "i" } },
        { creator: { $in: userIds } },
      ],
    });

    // If no posts are found, return an error
    if (!posts.length) {
      return next(new AppError("No posts found", 404));
    }

    // Return the found posts
    res.status(200).json({
      status: 200,
      length: posts.length,
      data: {
        posts,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error searching posts:", error);
    return next(new CustomError("Internal server error", 500));
  }
});

exports.updatePost = factory.updateOne(Post);
exports.getallPost = factory.getAll(Post);
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
