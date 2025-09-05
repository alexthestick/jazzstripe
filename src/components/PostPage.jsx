import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Comments from './Comments';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Get user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]);

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);
      
      // Fetch single post with all related data
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id (username),
          likes (user_id)
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      // Format post data
      const formattedPost = {
        id: postData.id,
        userId: postData.user_id,
        username: postData.profiles?.username || 'Unknown',
        imageUrl: postData.image_url,
        caption: postData.caption,
        clothingItems: postData.clothing_items || {},
        isFullBrand: postData.is_full_brand,
        fullBrandName: postData.full_brand_name,
        likes: postData.likes?.length || 0,
        timestamp: postData.created_at,
        likedBy: postData.likes?.map(like => like.user_id) || []
      };

      setPost(formattedPost);
      setLikes(formattedPost.likes);
      setLiked(user ? formattedPost.likedBy.includes(user.id) : false);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Build comment tree
      const commentMap = new Map();
      const rootComments = [];

      commentsData.forEach(comment => {
        const commentObj = {
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          username: comment.profiles?.username || 'Anonymous',
          content: comment.content,
          timestamp: new Date(comment.created_at).toLocaleString(),
          parentId: comment.parent_id || null,
          upvotes: comment.upvotes || 0,
          downvotes: comment.downvotes || 0,
          score: (comment.upvotes || 0) - (comment.downvotes || 0),
          replies: []
        };

        commentMap.set(comment.id, commentObj);
      });

      // Build tree structure
      commentMap.forEach(comment => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(comment);
          } else {
            rootComments.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (!error) {
          setLiked(false);
          setLikes(prev => prev - 1);
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (!error) {
          setLiked(true);
          setLikes(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText.trim()
        });

      if (error) throw error;

      setCommentText('');
      fetchPostAndComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return postTime.toLocaleDateString();
  };

  const getInitial = (username) => {
    return username ? username[0].toUpperCase() : '?';
  };

  const formatBrands = () => {
    if (!post) return [];
    
    const brands = [];
    Object.entries(post.clothingItems).forEach(([item, brand]) => {
      if (brand && brand.trim()) {
        brands.push(
          <span key={item} className={`brand-tag ${post.isFullBrand && brand === post.fullBrandName ? 'full-brand' : ''}`}>
            {item}: {brand}
          </span>
        );
      }
    });
    
    if (post.isFullBrand && post.fullBrandName) {
      brands.push(
        <span key="full-brand" className="brand-tag full-brand">
          {post.fullBrandName}
        </span>
      );
    }
    
    return brands;
  };

  if (loading) {
    return (
      <div className="post-page">
        <div className="post-page-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>Post</h1>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-page">
        <div className="post-page-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>Post</h1>
        </div>
        <div className="error">Post not found</div>
      </div>
    );
  }

  return (
    <div className="post-page">
      {/* Header with back button */}
      <div className="post-page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Post</h1>
      </div>

      {/* Post content */}
      <div className="post-page-content">
        <div className="post-full">
          <div className="post-header">
            <div className="user-avatar">
              {getInitial(post.username)}
            </div>
            <div className="post-info">
              <span className="username">@{post.username}</span>
              <span className="timestamp">{formatTimestamp(post.timestamp)}</span>
            </div>
          </div>
          
          <img src={post.imageUrl} alt="Outfit" className="post-image" />
          
          {post.caption && (
            <p className="post-caption">{post.caption}</p>
          )}
          
          {/* Clothing items */}
          <div className="clothing-items">
            {formatBrands()}
          </div>
          
          {/* Like button and comment count */}
          <div className="post-actions">
            <button 
              className={`like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              ♥ {likes}
            </button>
            <span className="comment-count">{comments.length} comments</span>
          </div>
        </div>

        {/* Comments section */}
        <div className="comments-section">
          <h3>Comments</h3>
          
          {/* Comment input */}
          {user && (
            <div className="comment-input-section">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && postComment()}
                className="comment-input"
              />
              <button 
                onClick={postComment}
                disabled={!commentText.trim()}
                className="comment-submit-button"
              >
                Post
              </button>
            </div>
          )}

          {/* Comments list */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">No comments yet. Be the first!</div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="avatar">
                    {getInitial(comment.username)}
                  </div>
                  <div className="comment-content-wrapper">
                    <div className="comment-header">
                      <span className="comment-username">
                        {comment.username}
                      </span>
                      <span className="comment-timestamp">
                        {formatTimestamp(comment.timestamp)}
                      </span>
                    </div>
                    <div className="comment-content">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
