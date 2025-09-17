import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';
import { formatRelativeTime } from '../utils/timeUtils';
import '../styles/modals/CommentsModal.css';

// RichTextComment component for formatting support
const RichTextComment = ({ content }) => {
  // Simple rich text parsing for basic formatting
  const parseContent = (text) => {
    if (!text) return '';
    
    // Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // User mentions: @username
    text = text.replace(/@(\w+)/g, '<span class="user-mention">@$1</span>');
    // Brand emphasis: [brand name]
    text = text.replace(/\[(.*?)\]/g, '<span class="brand-mention">$1</span>');
    
    return text;
  };

  return (
    <div 
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: parseContent(content) }}
    />
  );
};

// MOVE buildCommentTree OUTSIDE component to fix hooks issues
const buildCommentTree = (flatComments) => {
  const commentMap = {};
  const roots = [];
  
  // First pass: create map with all comments
  flatComments.forEach(comment => {
    commentMap[comment.id] = { 
      ...comment, 
      replies: [],
      username: comment.username || 'Anonymous',
      upvotes: comment.upvotes || 0,
      downvotes: comment.downvotes || 0,
      score: (comment.upvotes || 0) - (comment.downvotes || 0)
    };
  });
  
  // Second pass: build tree structure
  flatComments.forEach(comment => {
    if (comment.parent_id) {
      if (commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
      }
    } else {
      roots.push(commentMap[comment.id]);
    }
  });
  
  return roots;
};

// Recursive comment counter for accurate totals
const countAllComments = (comments) => {
  let count = 0;
  
  const countRecursive = (commentArray) => {
    commentArray.forEach(comment => {
      count++; // Count this comment
      if (comment.replies && comment.replies.length > 0) {
        countRecursive(comment.replies); // Count all nested replies
      }
    });
  };
  
  countRecursive(comments);
  return count;
};

// Improved sticky input with better reply UX
const ImprovedStickyInput = ({
  commentText,
  setCommentText,
  replyingTo,
  setReplyingTo,
  replyContext,
  onPostComment,
  onSubmitReply,
  isSubmitting
}) => {
  const [replyText, setReplyText] = useState('');
  
  const handleSubmit = () => {
    if (replyingTo && replyText.trim()) {
      onSubmitReply(replyingTo, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    } else if (!replyingTo && commentText.trim()) {
      onPostComment(commentText.trim());
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky-input-improved">
      {/* Reply context - stays visible above keyboard */}
      {replyingTo && replyContext && (
        <div className="reply-context-visible">
          <div className="reply-context-header">
            <span>Replying to @{replyContext.username}</span>
            <button 
              className="cancel-reply"
              onClick={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              ×
            </button>
          </div>
          <div className="reply-context-preview">
            {replyContext.content.substring(0, 100)}...
          </div>
        </div>
      )}
      
      <div className="input-container-improved">
        <textarea
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          value={replyingTo ? replyText : commentText}
          onChange={(e) => replyingTo ? setReplyText(e.target.value) : setCommentText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="comment-input-textarea"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        
        <button 
          className="submit-btn-improved"
          onClick={handleSubmit}
          disabled={isSubmitting || (replyingTo ? !replyText.trim() : !commentText.trim())}
        >
          {isSubmitting ? '...' : (replyingTo ? 'Reply' : 'Post')}
        </button>
      </div>
      
      {/* Rich text formatting hints */}
      <div className="formatting-hints">
        **bold** *italic* @user [brand]
      </div>
    </div>
  );
};

// Reddit-Style CommentThread with award system and improved UX
const CommentThread = ({ 
  comment, 
  depth = 0, 
  onVote, 
  onReply, 
  onAward,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  commentVotes,
  replyingTo,
  setReplyingTo
}) => {
  // ALL HOOKS AT TOP - NEVER CONDITIONAL
  const [showAwardMenu, setShowAwardMenu] = useState(false);
  const userVote = commentVotes[comment?.id];
  
  // SAFETY CHECK AFTER HOOKS
  if (!comment) {
    return <div>Error: Invalid comment</div>;
  }
  
  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 3;
  
  const handleUpvote = (e) => {
    e.stopPropagation();
    const newVote = userVote === 'up' ? null : 'up';
    onVote(comment.id, newVote);
  };
  
  const handleDownvote = (e) => {
    e.stopPropagation();
    const newVote = userVote === 'down' ? null : 'down';
    onVote(comment.id, newVote);
  };
  
  const handleReplyClick = (e) => {
    e.stopPropagation();
    setReplyingTo(comment.id); // Set global reply context
  };
  
  const handleAward = (awardType) => {
    onAward(comment.id, awardType);
    setShowAwardMenu(false);
  };

  return (
    <div className="comment-thread-reddit">
      <div className="comment-content-reddit">
        {/* Left Profile + Vote Column */}
        <div className="comment-left-column">
          <div className="comment-profile-mini">
            {comment.username?.charAt(0).toUpperCase() || '?'}
          </div>
          
          <div className="comment-vote-stack">
            <button 
              className={`vote-arrow up ${userVote === 'up' ? 'active' : ''}`}
              onClick={handleUpvote}
              aria-label="Upvote"
              disabled={!currentUser}
            >
              ▲
            </button>
            
            <div className={`vote-score-reddit ${userVote ? userVote : ''}`}>
              {comment.score || 0}
            </div>
            
            <button 
              className={`vote-arrow down ${userVote === 'down' ? 'active' : ''}`}
              onClick={handleDownvote}
              aria-label="Downvote"
              disabled={!currentUser}
            >
              ▼
            </button>
          </div>
        </div>
        
        {/* Comment Content Area */}
        <div className="comment-body-reddit">
          {/* Header with engagement indicators */}
          <div className="comment-header-reddit">
            <span className="username-reddit">{comment.username}</span>
            <span className="comment-meta">
              {comment.isOP && <span className="op-badge">OP</span>}
              {comment.hasRepliedToUser && <span className="replied-badge">↩️</span>}
              <span className="timestamp-reddit">{formatRelativeTime(comment.created_at)}</span>
            </span>
            
            {hasReplies && (
              <button 
                className="collapse-toggle-reddit"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(comment.id);
                }}
              >
                {isCollapsed ? `[+${comment.replies.length}]` : '[−]'}
              </button>
            )}
          </div>
          
          {/* Comment text with rich text support */}
          <div className="comment-text-reddit">
            <RichTextComment content={comment.content} />
          </div>
          
          {/* Awards display */}
          {comment.awards && comment.awards.length > 0 && (
            <div className="comment-awards">
              {comment.awards.map((award, index) => (
                <span key={index} className="award-display">
                  {award.type === 'cd' ? '💿' : award.icon} {award.count > 1 && award.count}
                </span>
              ))}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="comment-actions-reddit">
            <button className="action-btn reply-btn" onClick={handleReplyClick}>
              Reply
            </button>
            
            <button 
              className="action-btn award-btn"
              onClick={() => setShowAwardMenu(!showAwardMenu)}
            >
              💿 Award
            </button>
            
            <button className="action-btn share-btn">
              Share
            </button>
            
            {/* Award menu - Only CD Award for now */}
            {showAwardMenu && (
              <div className="award-menu">
                <button 
                  className="award-option"
                  onClick={() => handleAward('cd')}
                >
                  💿 CD Award
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Nested Replies */}
      {!isCollapsed && hasReplies && depth < maxDepth && (
        <div className="comment-replies-reddit">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onVote={onVote}
              onReply={onReply}
              onAward={onAward}
              currentUser={currentUser}
              isCollapsed={isCollapsed}
              onToggleCollapse={onToggleCollapse}
              commentVotes={commentVotes}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostPageContent = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // ALL STATE HOOKS AT TOP
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [error, setError] = useState(null);
  const [showBrands, setShowBrands] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentVotes, setCommentVotes] = useState({});
  const [collapsedComments, setCollapsedComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // RLS-SAFE fetchComments - handles database permissions robustly
  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      setError(null);
      console.log('Fetching comments for post:', postId);

      // STEP 1: Get basic comments (no joins that could be blocked by RLS)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Comments query error:', commentsError);
        throw commentsError;
      }

      console.log('Raw comments data:', commentsData);

      if (!commentsData || commentsData.length === 0) {
        console.log('No comments found for post:', postId);
        setComments([]);
        setCommentVotes({});
        return;
      }

      // STEP 2: Get usernames separately (safer than joins)
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Profiles query error (continuing with anonymous usernames):', profilesError);
      }

      // Create username lookup
      const usernameMap = {};
      if (profilesData) {
        profilesData.forEach(profile => {
          usernameMap[profile.id] = profile.username;
        });
      }
      console.log('Username map:', usernameMap);

      // STEP 2.5: Get awards for comments
      const commentIds = commentsData.map(c => c.id);
      const { data: awardsData, error: awardsError } = await supabase
        .from('comment_awards')
        .select('comment_id, award_type, created_at')
        .in('comment_id', commentIds);

      if (awardsError) {
        console.warn('Awards query error (continuing without awards):', awardsError);
      }

      // Group awards by comment
      const awardsMap = {};
      if (awardsData) {
        awardsData.forEach(award => {
          if (!awardsMap[award.comment_id]) {
            awardsMap[award.comment_id] = [];
          }
          awardsMap[award.comment_id].push(award);
        });
      }

      // STEP 3: Get user's votes if logged in
      let userVotes = [];
      if (user?.id) {
        const commentIds = commentsData.map(c => c.id);
        console.log('Fetching votes for comments:', commentIds);
        
        const { data: votesData, error: votesError } = await supabase
          .from('comment_votes')
          .select('comment_id, vote_type')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        if (votesError) {
          console.warn('User votes query error (continuing without votes):', votesError);
        } else {
          userVotes = votesData || [];
          console.log('User votes:', userVotes);
        }
      }

      // STEP 4: Transform comments using stored upvotes/downvotes from database
      const transformedComments = commentsData.map(comment => {
        const awards = awardsMap[comment.id] || [];
        const awardCounts = {};
        awards.forEach(award => {
          awardCounts[award.award_type] = (awardCounts[award.award_type] || 0) + 1;
        });
        
        const awardsList = Object.entries(awardCounts).map(([type, count]) => ({
          type,
          count,
          icon: '💿' // Only CD Award for now
        }));

        return {
          id: comment.id,
          content: comment.content || '',
          username: usernameMap[comment.user_id] || 'Anonymous',
          created_at: comment.created_at,
          user_id: comment.user_id,
          parent_id: comment.parent_id,
          upvotes: comment.upvotes || 0, // Use stored counts from database
          downvotes: comment.downvotes || 0, // Use stored counts from database
          score: (comment.upvotes || 0) - (comment.downvotes || 0),
          userVote: userVotes.find(v => v.comment_id === comment.id)?.vote_type || null,
          awards: awardsList,
          isOP: comment.user_id === post?.userId, // Check if this is the original poster
          hasRepliedToUser: false // TODO: Implement logic to check if user has replied to this comment
        };
      });

      console.log('Transformed comments:', transformedComments);

      const commentTree = buildCommentTree(transformedComments);
      setComments(commentTree);
      
      // Set vote states
      const votes = {};
      userVotes.forEach(vote => {
        votes[vote.comment_id] = vote.vote_type;
      });
      setCommentVotes(votes);
      
      console.log('✅ Comments successfully loaded:', commentTree.length);
      
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // More specific error messages
      if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
        setError('Comments are temporarily unavailable. Please try again later.');
      } else if (error.message.includes('foreign key')) {
        setError('Database configuration error. Please contact support.');
      } else {
        setError('Failed to load comments. Please try again.');
      }
    }
  }, [postId, user?.id, post?.userId]);

  // FIXED fetchPostAndComments
  const fetchPostAndComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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

    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  // VOTE HANDLER
  const handleVoteWithRetry = useCallback(async (commentId, voteType) => {
    if (!user) {
      setError('Please login to vote');
      return;
    }

    try {
      // Optimistic update
      setCommentVotes(prev => ({
        ...prev,
        [commentId]: prev[commentId] === voteType ? null : voteType
      }));

      if (voteType) {
        await supabase
          .from('comment_votes')
          .upsert({
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType
          });
      } else {
        await supabase
          .from('comment_votes')
          .delete()
          .match({ comment_id: commentId, user_id: user.id });
      }
      
      // Refresh comments after a short delay
      setTimeout(fetchComments, 200);
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to vote. Please try again.');
    }
  }, [user, fetchComments]);

  // POST COMMENT
  const postCommentOptimistic = useCallback(async (content) => {
    if (!content.trim() || !user) return;

    try {
      setIsSubmittingComment(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;

      setCommentText('');
      await fetchComments();
    } catch (error) {
      setError('Failed to post comment');
      console.error('Comment post failed:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [postId, user, fetchComments]);

  // SUBMIT REPLY - Updated for inline reply system
  const handleSubmitReply = useCallback(async (parentId, replyContent) => {
    if (!replyContent.trim() || !user) return;
    
    try {
      setIsSubmittingComment(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent,
          parent_id: parentId,
          depth: 1
        });
      
      if (error) throw error;
      
      await fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [postId, user, fetchComments]);

  // AWARD HANDLING
  const handleAward = useCallback(async (commentId, awardType) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('comment_awards')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          award_type: awardType
        });
      
      if (error) throw error;
      await fetchComments(); // Refresh to show new award
    } catch (error) {
      console.error('Award error:', error);
      setError('Failed to give award');
    }
  }, [user, fetchComments]);

  // HELPER FUNCTION FOR REPLY CONTEXT
  const findCommentById = useCallback((comments, commentId) => {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      if (comment.replies?.length > 0) {
        const found = findCommentById(comment.replies, commentId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Note: Removed dynamic image height calculation - now using fixed aspect ratios

  // ALL useEffect HOOKS
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting user session:', error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, fetchPostAndComments]);

  useEffect(() => {
    if (postId && post && user !== undefined) {
      fetchComments();
    }
  }, [postId, post, user, fetchComments]);

  // HELPER FUNCTIONS
  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        setLiked(false);
        setLikes(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        setLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleImageTap = useCallback(() => {
    setShowBrands(prev => !prev);
  }, []);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
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
    
    return brands;
  };

  // LOADING STATE
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

  // ERROR STATE
  if (error && !post) {
    return (
      <div className="post-page">
        <div className="post-page-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>Post</h1>
        </div>
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchPostAndComments();
            }}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // NO POST STATE
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

  // MAIN RENDER
  return (
    <div className="post-page">
      <div className="post-page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Jazzstripe</h1>
      </div>

      <div className="post-comments-unified">
        {/* Post Content Section */}
        <div className="post-content-section">
          {/* Compact Post Author Header */}
          <div className="post-author-header-compact">
            <div className="user-avatar-small">
              {getInitial(post.username)}
            </div>
            <div className="post-meta-compact">
              <span className="username-compact">@{post.username}</span>
              <span className="timestamp-compact">{formatTimestamp(post.timestamp)}</span>
            </div>
          </div>
          
          {/* Caption Above Image (Reddit Style) */}
          {post.caption && (
            <div className="post-caption-compact">
              {post.caption}
            </div>
          )}
          
          {/* Future: Community Tags Section */}
          <div className="post-tags">
            {/* Placeholder for future WDYWT, Streetwear tags */}
          </div>
          
          {/* Full-Width Post Image */}
          <div className="post-image-container">
            <img 
              src={post.imageUrl} 
              alt="Outfit" 
              className="post-image-full"
              onClick={handleImageTap}
              style={{ cursor: 'pointer' }}
              aria-label="Tap to reveal brand information"
            />
            
            {/* Brand Reveal Overlay */}
            {showBrands && (
              <div className="brand-reveal-overlay">
                {formatBrands()}
              </div>
            )}
          </div>
          
          {/* Tight Engagement Bar */}
          <div className="post-engagement-bar-tight">
            <button 
              className={`engagement-btn like-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              ♥ {likes}
            </button>
            <span className="engagement-metric">
              💬 {countAllComments(comments)}
            </span>
            <button className="engagement-btn share-btn" aria-label="Share post">
              ↗
            </button>
          </div>
        </div>

        {/* Seamless Comments Section - NO HEADER, direct flow */}
        <div className="comments-section-seamless">
          {error && (
            <div className="error-message">
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
          
          <div className="comments-modal-comments-list">
            {comments.length > 0 ? (
              comments.map(comment => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  onVote={handleVoteWithRetry}
                  onReply={handleSubmitReply}
                  onAward={handleAward}
                  currentUser={user}
                  isCollapsed={collapsedComments[comment.id]}
                  onToggleCollapse={(commentId) => {
                    setCollapsedComments(prev => ({
                      ...prev,
                      [commentId]: !prev[commentId]
                    }));
                  }}
                  commentVotes={commentVotes}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
        
        {/* Improved Sticky Input with Reply Context */}
        <ImprovedStickyInput
          commentText={commentText}
          setCommentText={setCommentText}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyContext={findCommentById(comments, replyingTo)}
          onPostComment={postCommentOptimistic}
          onSubmitReply={handleSubmitReply}
          isSubmitting={isSubmittingComment}
        />
      </div>
    </div>
  );
};

// MAIN EXPORT
const PostPage = () => {
  return (
    <ErrorBoundary>
      <PostPageContent />
    </ErrorBoundary>
  );
};

export default PostPage;