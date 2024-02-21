const Comment = require("../models/commentModel");
const Follow = require("../models/friendsModel");
const Like = require("../models/likeModel");
const Saved = require("../models/saveModel");

const followingsCheckArray = async (userId, users) => {
  const followings = await Follow.find({ creator: userId });
  //   console.log("followings", followings);
  const followIdsOnly = followings.map((following) => following.following.id);

  //   console.log("Ids", followIdsOnly);

  //   console.log("user", users);

  for (const user of users) {
    // console.log("User", user.id);
    // console.log("Req User", userId);
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
  }

  return users;
};

const followingsCheckSingle = async (userId, user) => {
  const followings = await Follow.find({ creator: userId });
  console.log("followings", followings);
  const followIdsOnly = followings.map((following) => following.following.id);
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

  return user;
};

const PostChecksArray = async (userId, posts) => {
  const followings = await Follow.find({ creator: userId });
  //   console.log("followings", followings);
  const followIdsOnly = followings.map((following) => following?.following?.id);

  for (let post of posts) {
    post = await PostCheckSingle(userId, post);

    // console.log("FOLLOWIDS", followIdsOnly, "USERID", userId);
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
  post.isLiked = isLiked;
  post.isSaved = isSaved;
  post.totalLikes = totalLikes;
  post.totalComments = totalComments;
  post.isOwner = post?.creator?.id === userId ? true : false;
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
