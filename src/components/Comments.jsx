import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const Comments = ({ postId, isOpen, onClose, user, getInitial, formatTimestamp, selectedPost }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchComments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (username)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching comments:', error);
                return;
            }
            
            if (data) {
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [postId]);

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId, fetchComments]);

    const submitComment = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setLoading(true);
        const { error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content: newComment.trim()
            });

        if (!error) {
            setNewComment('');
            fetchComments();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content comments-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Comments</h2>
                    <button className="close-button" onClick={onClose}>
                        ✕
                    </button>
                </div>
                
                {selectedPost && (
                    <div className="comments-post-info">
                        <span className="username">@{selectedPost.username}</span>
                        <p className="caption">{selectedPost.caption}</p>
                    </div>
                )}

                <div className="comments-list">
                    {loading ? (
                        <div className="loading">Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div className="no-comments">No comments yet. Be the first!</div>
                    ) : (
                        <div>
                            {comments.map(comment => (
                                <div key={comment.id} className="comment">
                                    <div className="avatar">
                                        {getInitial(comment.profiles?.username)}
                                    </div>
                                    <div className="comment-content-wrapper">
                                        <div className="comment-header">
                                            <span className="comment-username">
                                                {comment.profiles?.username}
                                            </span>
                                            <span className="comment-timestamp">
                                                {formatTimestamp(comment.created_at)}
                                            </span>
                                        </div>
                                        <div className="comment-content">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {user && (
                    <div className="comment-input-section">
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    submitComment(e);
                                }
                            }}
                            className="comment-input"
                        />
                        <button 
                            onClick={submitComment}
                            className="comment-submit-button"
                            disabled={loading || !newComment.trim()}
                        >
                            Post
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Comments;
