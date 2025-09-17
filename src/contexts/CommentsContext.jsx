import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { checkRateLimit, recordAction } from '../utils/rateLimiter';
import { sanitizeAndValidateComment } from '../utils/sanitize';

// Initial state
const initialState = {
  comments: [],
  commentVotes: {},
  collapsedComments: {},
  replyingTo: null,
  replyText: '',
  commentText: '',
  isSubmittingComment: false,
  isSubmittingReply: false,
  error: null,
  loading: false
};

// Action types
const ACTIONS = {
  SET_COMMENTS: 'SET_COMMENTS',
  SET_COMMENT_VOTES: 'SET_COMMENT_VOTES',
  SET_COLLAPSED_COMMENTS: 'SET_COLLAPSED_COMMENTS',
  SET_REPLYING_TO: 'SET_REPLYING_TO',
  SET_REPLY_TEXT: 'SET_REPLY_TEXT',
  SET_COMMENT_TEXT: 'SET_COMMENT_TEXT',
  SET_SUBMITTING_COMMENT: 'SET_SUBMITTING_COMMENT',
  SET_SUBMITTING_REPLY: 'SET_SUBMITTING_REPLY',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  TOGGLE_COMMENT_COLLAPSE: 'TOGGLE_COMMENT_COLLAPSE',
  UPDATE_COMMENT_VOTE: 'UPDATE_COMMENT_VOTE',
  ADD_COMMENT: 'ADD_COMMENT',
  ADD_REPLY: 'ADD_REPLY',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const commentsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_COMMENTS:
      return { ...state, comments: action.payload };
    
    case ACTIONS.SET_COMMENT_VOTES:
      return { ...state, commentVotes: action.payload };
    
    case ACTIONS.SET_COLLAPSED_COMMENTS:
      return { ...state, collapsedComments: action.payload };
    
    case ACTIONS.SET_REPLYING_TO:
      return { ...state, replyingTo: action.payload };
    
    case ACTIONS.SET_REPLY_TEXT:
      return { ...state, replyText: action.payload };
    
    case ACTIONS.SET_COMMENT_TEXT:
      return { ...state, commentText: action.payload };
    
    case ACTIONS.SET_SUBMITTING_COMMENT:
      return { ...state, isSubmittingComment: action.payload };
    
    case ACTIONS.SET_SUBMITTING_REPLY:
      return { ...state, isSubmittingReply: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.TOGGLE_COMMENT_COLLAPSE:
      return {
        ...state,
        collapsedComments: {
          ...state.collapsedComments,
          [action.payload]: !state.collapsedComments[action.payload]
        }
      };
    
    case ACTIONS.UPDATE_COMMENT_VOTE:
      return {
        ...state,
        commentVotes: {
          ...state.commentVotes,
          [action.payload.commentId]: action.payload.voteType
        }
      };
    
    case ACTIONS.ADD_COMMENT:
      return {
        ...state,
        comments: [action.payload, ...state.comments],
        commentText: '',
        error: null
      };
    
    case ACTIONS.ADD_REPLY:
      return {
        ...state,
        comments: state.comments.map(comment => 
          comment.id === action.payload.parentId
            ? { ...comment, replies: [...(comment.replies || []), action.payload.reply] }
            : comment
        ),
        replyText: '',
        replyingTo: null,
        error: null
      };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Context
const CommentsContext = createContext();

// Provider component
export const CommentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(commentsReducer, initialState);

  // Action creators
  const setComments = useCallback((comments) => {
    dispatch({ type: ACTIONS.SET_COMMENTS, payload: comments });
  }, []);

  const setCommentVotes = useCallback((votes) => {
    dispatch({ type: ACTIONS.SET_COMMENT_VOTES, payload: votes });
  }, []);

  const setCollapsedComments = useCallback((collapsed) => {
    dispatch({ type: ACTIONS.SET_COLLAPSED_COMMENTS, payload: collapsed });
  }, []);

  const setReplyingTo = useCallback((commentId) => {
    dispatch({ type: ACTIONS.SET_REPLYING_TO, payload: commentId });
  }, []);

  const setReplyText = useCallback((text) => {
    dispatch({ type: ACTIONS.SET_REPLY_TEXT, payload: text });
  }, []);

  const setCommentText = useCallback((text) => {
    dispatch({ type: ACTIONS.SET_COMMENT_TEXT, payload: text });
  }, []);

  const setSubmittingComment = useCallback((isSubmitting) => {
    dispatch({ type: ACTIONS.SET_SUBMITTING_COMMENT, payload: isSubmitting });
  }, []);

  const setSubmittingReply = useCallback((isSubmitting) => {
    dispatch({ type: ACTIONS.SET_SUBMITTING_REPLY, payload: isSubmitting });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const toggleCommentCollapse = useCallback((commentId) => {
    dispatch({ type: ACTIONS.TOGGLE_COMMENT_COLLAPSE, payload: commentId });
  }, []);

  const updateCommentVote = useCallback((commentId, voteType) => {
    dispatch({ type: ACTIONS.UPDATE_COMMENT_VOTE, payload: { commentId, voteType } });
  }, []);

  const addComment = useCallback((comment) => {
    dispatch({ type: ACTIONS.ADD_COMMENT, payload: comment });
  }, []);

  const addReply = useCallback((parentId, reply) => {
    dispatch({ type: ACTIONS.ADD_REPLY, payload: { parentId, reply } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  // Enhanced action handlers with validation and rate limiting
  const handleVote = useCallback(async (commentId, voteType, userId, onVoteSuccess, onVoteError) => {
    if (!userId) {
      setError('Please login to vote');
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit('VOTE', userId);
    if (!rateLimit.allowed) {
      setError(rateLimit.message);
      return;
    }

    try {
      // Optimistic update
      updateCommentVote(commentId, voteType);
      recordAction('VOTE', userId);
      
      // Call the actual vote function
      await onVoteSuccess(commentId, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to vote. Please try again.');
      // Revert optimistic update
      updateCommentVote(commentId, null);
      onVoteError?.(error);
    }
  }, [updateCommentVote, setError]);

  const handleComment = useCallback(async (commentText, userId, onCommentSuccess, onCommentError) => {
    if (!userId) {
      setError('Please login to comment');
      return;
    }

    // Validate and sanitize comment
    const validation = sanitizeAndValidateComment(commentText);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (validation.hasProfanity) {
      setError(validation.error);
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit('COMMENT', userId);
    if (!rateLimit.allowed) {
      setError(rateLimit.message);
      return;
    }

    try {
      setSubmittingComment(true);
      recordAction('COMMENT', userId);
      
      // Call the actual comment function
      await onCommentSuccess(validation.sanitized);
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
      onCommentError?.(error);
    } finally {
      setSubmittingComment(false);
    }
  }, [setSubmittingComment, setError]);

  const handleReply = useCallback(async (replyText, parentId, userId, onReplySuccess, onReplyError) => {
    if (!userId) {
      setError('Please login to reply');
      return;
    }

    // Validate and sanitize reply
    const validation = sanitizeAndValidateComment(replyText);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (validation.hasProfanity) {
      setError(validation.error);
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit('REPLY', userId);
    if (!rateLimit.allowed) {
      setError(rateLimit.message);
      return;
    }

    try {
      setSubmittingReply(true);
      recordAction('REPLY', userId);
      
      // Call the actual reply function
      await onReplySuccess(validation.sanitized, parentId);
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply. Please try again.');
      onReplyError?.(error);
    } finally {
      setSubmittingReply(false);
    }
  }, [setSubmittingReply, setError]);

  const value = {
    // State
    ...state,
    
    // Basic actions
    setComments,
    setCommentVotes,
    setCollapsedComments,
    setReplyingTo,
    setReplyText,
    setCommentText,
    setSubmittingComment,
    setSubmittingReply,
    setError,
    setLoading,
    toggleCommentCollapse,
    updateCommentVote,
    addComment,
    addReply,
    clearError,
    
    // Enhanced actions
    handleVote,
    handleComment,
    handleReply
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

// Hook to use the context
export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};

export default CommentsContext;

