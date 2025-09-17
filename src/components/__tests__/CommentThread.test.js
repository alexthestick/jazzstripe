import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentThread from '../CommentThread';

// Mock the timeUtils
jest.mock('../../utils/timeUtils', () => ({
  formatRelativeTime: (timestamp) => '2h ago'
}));

// Mock the CommentsContext
const mockContextValue = {
  commentVotes: {},
  collapsedComments: {},
  handleVote: jest.fn(),
  handleReply: jest.fn(),
  toggleCommentCollapse: jest.fn()
};

jest.mock('../../contexts/CommentsContext', () => ({
  useComments: () => mockContextValue
}));

describe('CommentThread', () => {
  const mockComment = {
    id: '1',
    content: 'This is a test comment',
    username: 'testuser',
    created_at: '2023-01-01T00:00:00Z',
    upvotes: 5,
    replies: []
  };

  const mockCommentWithReplies = {
    id: '1',
    content: 'This is a test comment',
    username: 'testuser',
    created_at: '2023-01-01T00:00:00Z',
    upvotes: 5,
    replies: [
      {
        id: '2',
        content: 'This is a reply',
        username: 'replyuser',
        created_at: '2023-01-01T01:00:00Z',
        upvotes: 2,
        replies: []
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders comment content correctly', () => {
    render(<CommentThread comment={mockComment} />);
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('handles double tap like functionality', async () => {
    render(<CommentThread comment={mockComment} />);
    
    const commentContent = screen.getByText('This is a test comment');
    
    // Simulate double tap
    fireEvent.click(commentContent);
    fireEvent.click(commentContent);
    
    await waitFor(() => {
      expect(mockContextValue.handleVote).toHaveBeenCalledWith('1', 'up');
    });
  });

  test('handles single tap like button', () => {
    render(<CommentThread comment={mockComment} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);
    
    expect(mockContextValue.handleVote).toHaveBeenCalledWith('1', 'up');
  });

  test('handles reply button click', () => {
    render(<CommentThread comment={mockComment} />);
    
    const replyButton = screen.getByRole('button', { name: /reply/i });
    fireEvent.click(replyButton);
    
    expect(mockContextValue.handleReply).toHaveBeenCalledWith('1');
  });

  test('shows collapse button when comment has replies', () => {
    render(<CommentThread comment={mockCommentWithReplies} />);
    
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  test('handles collapse button click', () => {
    render(<CommentThread comment={mockCommentWithReplies} />);
    
    const collapseButton = screen.getByText('−');
    fireEvent.click(collapseButton);
    
    expect(mockContextValue.toggleCommentCollapse).toHaveBeenCalledWith('1');
  });

  test('renders replies when not collapsed', () => {
    render(<CommentThread comment={mockCommentWithReplies} />);
    
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  test('does not render replies when collapsed', () => {
    const collapsedContextValue = {
      ...mockContextValue,
      collapsedComments: { '1': true }
    };
    
    jest.mocked(require('../../contexts/CommentsContext').useComments).mockReturnValue(collapsedContextValue);
    
    render(<CommentThread comment={mockCommentWithReplies} />);
    
    expect(screen.queryByText('This is a reply')).not.toBeInTheDocument();
  });

  test('shows heart animation on double tap', async () => {
    render(<CommentThread comment={mockComment} />);
    
    const commentContent = screen.getByText('This is a test comment');
    
    // Simulate double tap
    fireEvent.click(commentContent);
    fireEvent.click(commentContent);
    
    await waitFor(() => {
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
  });

  test('handles keyboard navigation', () => {
    render(<CommentThread comment={mockComment} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    const replyButton = screen.getByRole('button', { name: /reply/i });
    
    // Test tab navigation
    likeButton.focus();
    expect(likeButton).toHaveFocus();
    
    fireEvent.keyDown(likeButton, { key: 'Tab' });
    expect(replyButton).toHaveFocus();
  });

  test('has proper accessibility attributes', () => {
    render(<CommentThread comment={mockComment} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    const replyButton = screen.getByRole('button', { name: /reply/i });
    
    expect(likeButton).toHaveAttribute('aria-label');
    expect(replyButton).toHaveAttribute('aria-label');
  });

  test('handles error states gracefully', () => {
    const errorComment = {
      ...mockComment,
      content: null,
      username: null
    };
    
    render(<CommentThread comment={errorComment} />);
    
    // Should not crash and should show fallback content
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });
});

