const Comment = require("../models/commentModel");
const Follow = require("../models/friendsModel");
const Like = require("../models/likeModel");
const Saved = require("../models/saveModel");
const User = require("../models/userModel");

const followingsCheckArray = async (userId, users) => {
  const followings = await Follow.find({ creator: userId });
  const followIdsOnly = followings.map((following) => following.following.id);

  for (const user of users) {
    if (user.id === userId) {
      user.isSelf = true;
    } else {
      user.isSelf = false;
    }
    if (followIdsOnly.includes(user.id)) {
      user.isFollowing = true;
    } else {
      user.isFollowing = false;
    }

    // Modify user object to include additional properties
    user = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isSelf: user.isSelf,
      isFollowing: user.isFollowing,
    };
  }

  return users;
};

const followingsCheckSingle = async (userId, user) => {
  const followings = await Follow.find({ creator: userId });
  console.log("followings", followings);
  const followIdsOnly = followings.map((following) => following.following.id);

  // Check if the user is the same as the logged-in user
  if (user.id === userId) {
    user.isSelf = true;
  } else {
    user.isSelf = false;
  }

  // Check if the logged-in user is following the user
  if (followIdsOnly.includes(user.id)) {
    user.isFollowing = true;
  } else {
    user.isFollowing = false;
  }

  // Return the user details with additional properties
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isSelf: user.isSelf,
    isFollowing: user.isFollowing,
  };
};

const PostChecksArray = async (userId, posts) => {
  const followings = await Follow.find({ creator: userId });
  const followIdsOnly = followings.map((following) => following?.following?.id);

  for (let post of posts) {
    // Include user details in the creator object using PostCheckSingle function
    post = await PostCheckSingle(userId, post);

    if (followIdsOnly.includes(post?.creator?.id)) {
      post.isFollowing = true;
    } else {
      post.isFollowing = false;
    }
  }
  return posts;
};

const PostCheckSingle = async (userId, post) => {
  const [isLiked, isSaved, totalLikes, totalComments] = await Promise.all([
    (await likeCheck(userId, post?._id)) ? true : false,
    (await saveCheck(userId, post?._id)) ? true : false,
    Like.countDocuments({ like: post?._id }),
    Comment.countDocuments({ post: post?._id }),
  ]);

  // Include user details in the creator object
  const creatorDetails = await User.findById(post.creator);

  post.isLiked = isLiked;
  post.isSaved = isSaved;
  post.totalLikes = totalLikes;
  post.totalComments = totalComments;
  post.isOwner = post?.creator === userId ? true : false;
  post.creator = {
    id: creatorDetails._id,
    name: creatorDetails.name,
    email: creatorDetails.email,
    image: creatorDetails.image,
  };

  return post;
};

const likeCheck = async (userId, postId) => {
  const like = await Like.findOne({ creator: userId, like: postId });
  if (like) {
    return true;
  } else return false;
};

const saveCheck = async (userId, postId) => {
  const saved = await Saved.findOne({ creator: userId, saved: postId });
  if (saved) {
    return true;
  } else return false;
};

const commentsCheck = async (userId, comments) => {
  for (const comment of comments) {
    comment.isOwner = comment?.creator?.id === userId ? true : false;
  }
  return comments;
};

const storiesViewCheck = (userId, stories) => {
  for (const story of stories) {
    const views = story.views.map((view) => view?.creator?._id);
    story.isSeen = views.includes(userId) ? true : false;
  }
  return stories;
};

module.exports = {
  followingsCheckArray,
  followingsCheckSingle,
  PostChecksArray,
  PostCheckSingle,
  likeCheck,
  commentsCheck,
  storiesViewCheck,
};
