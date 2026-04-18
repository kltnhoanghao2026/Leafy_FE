import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityView } from "./CommunityView";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  CommunityCommentResponse,
  CommunityPostResponse,
  CommunitySpringPage,
} from "../types";

const postOne = (
  overrides: Partial<CommunityPostResponse> = {},
): CommunityPostResponse => ({
  id: "post-1",
  authorId: "profile-1",
  authorInfo: {
    id: "profile-1",
    fullName: "Backend Farmer",
    avatar: "https://example.com/avatar.png",
    role: "USER",
    isVerified: true,
    lastSyncedAt: "2026-04-16T03:00:00Z",
  },
  groupId: null,
  content: {
    caption: "Backend coffee leaf question",
    description: null,
    title: null,
    hashtags: [],
  },
  media: [],
  postType: "FEED",
  sharedPostId: null,
  originalAuthorId: null,
  sharedCaption: null,
  sharedPostInfo: null,
  rootPostId: null,
  location: { name: "Da Lat" },
  visibility: "ALL",
  stats: {
    upvoteCount: 3,
    downvoteCount: 0,
    commentCount: 1,
    shareCount: 2,
  },
  currentUserVoteType: null,
  uploadedAt: "2026-04-16T03:00:00Z",
  updatedAt: "2026-04-16T03:00:00Z",
  isEdited: false,
  ...overrides,
});

const commentOne = (
  overrides: Partial<CommunityCommentResponse> = {},
): CommunityCommentResponse => ({
  id: "comment-1",
  postId: "post-1",
  authorId: "profile-2",
  authorInfo: {
    id: "profile-2",
    fullName: "Backend Expert",
    avatar: "https://example.com/expert.png",
    role: "EXPERT",
    isVerified: true,
    lastSyncedAt: "2026-04-16T03:00:00Z",
  },
  parentId: null,
  content: "Backend comment from service",
  media: [],
  replyDepth: 0,
  replyCount: 0,
  upvoteCount: 4,
  downvoteCount: 0,
  active: true,
  createdAt: "2026-04-16T03:05:00Z",
  lastModifiedAt: "2026-04-16T03:05:00Z",
  isEdited: false,
  ...overrides,
});

const springPage = <T,>(
  content: T[],
  page = 0,
  totalElements = content.length,
): CommunitySpringPage<T> => ({
  content,
  number: page,
  size: 10,
  totalElements,
  totalPages: totalElements > 10 ? 2 : totalElements > 0 ? 1 : 0,
  first: page === 0,
  last: totalElements <= 10 || page > 0,
  numberOfElements: content.length,
});

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const useFeed = (posts: CommunityPostResponse[] = [postOne()]) => {
  server.use(
    http.get("*/api/posts/feed", () => {
      return HttpResponse.json(envelope(springPage(posts)));
    }),
  );
};

describe("CommunityView", () => {
  it("renders backend feed and ignores local community-storage feed data", async () => {
    window.localStorage.setItem(
      "community-storage",
      JSON.stringify({
        state: {
          posts: [
            {
              id: "local-post",
              content: "Local-only post must not render",
            },
          ],
        },
        version: 0,
      }),
    );
    useFeed();

    renderWithClient(<CommunityView />);

    expect(
      await screen.findByText("Backend coffee leaf question"),
    ).toBeInTheDocument();
    expect(screen.getByText("Backend Farmer")).toBeInTheDocument();
    expect(
      screen.queryByText("Local-only post must not render"),
    ).not.toBeInTheDocument();
  });

  it("shows the backend feed loading state", async () => {
    server.use(
      http.get("*/api/posts/feed", async () => {
        await delay(100);
        return HttpResponse.json(envelope(springPage([postOne()])));
      }),
    );

    renderWithClient(<CommunityView />);

    expect(screen.getByLabelText("Loading community feed")).toBeInTheDocument();
  });

  it("shows the empty state when the backend feed is empty", async () => {
    useFeed([]);

    renderWithClient(<CommunityView />);

    expect(await screen.findByText("No community posts")).toBeInTheDocument();
  });

  it("shows an error state with retry when feed loading fails", async () => {
    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<CommunityView />);

    expect(
      await screen.findByText("Community feed could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("creates a backend post and refreshes the feed", async () => {
    let posts = [postOne()];
    let submittedBody: unknown;

    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json(envelope(springPage(posts)));
      }),
      http.post("*/api/posts", async ({ request }) => {
        submittedBody = await request.json();
        posts = [
          postOne({
            id: "post-2",
            content: {
              caption: "New backend post",
              description: null,
              title: null,
              hashtags: [],
            },
            stats: {
              upvoteCount: 0,
              downvoteCount: 0,
              commentCount: 0,
              shareCount: 0,
            },
          }),
          ...posts,
        ];
        return HttpResponse.json(envelope(posts[0]));
      }),
    );

    renderWithClient(<CommunityView />);

    await screen.findByText("Backend coffee leaf question");
    await userEvent.click(screen.getAllByRole("button", { name: /open create post/i })[0]);
    await userEvent.type(
      screen.getByPlaceholderText(/share a garden update/i),
      "New backend post",
    );
    await userEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(submittedBody).toMatchObject({
        content: { caption: "New backend post" },
        postType: "FEED",
        visibility: "ALL",
      });
    });
    expect(await screen.findByText("New backend post")).toBeInTheDocument();
  });

  it("loads comments from backend and posts a new backend comment", async () => {
    let comments = [commentOne()];
    let submittedBody: unknown;
    let feedPosts = [postOne()];

    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json(envelope(springPage(feedPosts)));
      }),
      http.get("*/api/comments/posts/:postId", ({ params }) => {
        expect(params.postId).toBe("post-1");
        return HttpResponse.json(envelope(springPage(comments)));
      }),
      http.post("*/api/comments", async ({ request }) => {
        submittedBody = await request.json();
        comments = [
          ...comments,
          commentOne({
            id: "comment-2",
            content: "New backend comment",
            upvoteCount: 0,
          }),
        ];
        feedPosts = [
          postOne({
            stats: {
              upvoteCount: 3,
              downvoteCount: 0,
              commentCount: 2,
              shareCount: 2,
            },
          }),
        ];
        return HttpResponse.json(envelope(comments[1]));
      }),
    );

    renderWithClient(<CommunityView />);

    await screen.findByText("Backend coffee leaf question");
    await userEvent.click(
      screen.getByRole("button", { name: /toggle comments for post post-1/i }),
    );
    expect(
      await screen.findByText("Backend comment from service"),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText("Write a comment..."),
      "New backend comment",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit comment" }));

    await waitFor(() => {
      expect(submittedBody).toEqual({
        postId: "post-1",
        content: "New backend comment",
        media: [],
      });
    });
    expect(await screen.findByText("New backend comment")).toBeInTheDocument();
  });

  it("votes on a post through the backend", async () => {
    let voteCalled = false;
    let posts = [postOne()];

    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json(envelope(springPage(posts)));
      }),
      http.post("*/api/votes/POST/:postId", ({ request, params }) => {
        const url = new URL(request.url);
        expect(params.postId).toBe("post-1");
        expect(url.searchParams.get("type")).toBe("UPVOTE");
        voteCalled = true;
        posts = [
          postOne({
            stats: {
              upvoteCount: 4,
              downvoteCount: 0,
              commentCount: 1,
              shareCount: 2,
            },
            currentUserVoteType: "UPVOTE",
          }),
        ];
        return HttpResponse.json(envelope(null));
      }),
    );

    renderWithClient(<CommunityView />);

    await screen.findByText("Backend coffee leaf question");
    await userEvent.click(screen.getByRole("button", { name: /like post post-1/i }));

    await waitFor(() => {
      expect(voteCalled).toBe(true);
    });
    expect(await screen.findByText("4")).toBeInTheDocument();
  });

  it("votes on a comment through the backend", async () => {
    let commentVoteCalled = false;
    let comments = [commentOne()];

    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json(envelope(springPage([postOne()])));
      }),
      http.get("*/api/comments/posts/:postId", () => {
        return HttpResponse.json(envelope(springPage(comments)));
      }),
      http.post("*/api/votes/COMMENT/:commentId", ({ request, params }) => {
        const url = new URL(request.url);
        expect(params.commentId).toBe("comment-1");
        expect(url.searchParams.get("type")).toBe("UPVOTE");
        commentVoteCalled = true;
        comments = [commentOne({ upvoteCount: 5 })];
        return HttpResponse.json(envelope(null));
      }),
    );

    renderWithClient(<CommunityView />);

    await screen.findByText("Backend coffee leaf question");
    await userEvent.click(
      screen.getByRole("button", { name: /toggle comments for post post-1/i }),
    );
    await screen.findByText("Backend comment from service");
    await userEvent.click(
      screen.getByRole("button", { name: /like comment comment-1/i }),
    );

    await waitFor(() => {
      expect(commentVoteCalled).toBe(true);
    });
    expect(await screen.findByText("5")).toBeInTheDocument();
  });

  it("reposts through the backend share contract", async () => {
    let submittedBody: unknown;
    let posts = [postOne()];

    server.use(
      http.get("*/api/posts/feed", () => {
        return HttpResponse.json(envelope(springPage(posts)));
      }),
      http.post("*/api/posts", async ({ request }) => {
        submittedBody = await request.json();
        posts = [
          postOne({
            id: "share-1",
            postType: "SHARE",
            content: {
              caption: "Sharing this",
              description: null,
              title: null,
              hashtags: [],
            },
            sharedPostId: "post-1",
            originalAuthorId: "profile-1",
            sharedPostInfo: postOne(),
          }),
          ...posts,
        ];
        return HttpResponse.json(envelope(posts[0]));
      }),
    );

    renderWithClient(<CommunityView />);

    await screen.findByText("Backend coffee leaf question");
    await userEvent.click(screen.getByRole("button", { name: /share post post-1/i }));
    await userEvent.type(screen.getByPlaceholderText("Add a thought..."), "Sharing this");
    await userEvent.click(screen.getByRole("button", { name: "Repost" }));

    await waitFor(() => {
      expect(submittedBody).toMatchObject({
        postType: "SHARE",
        sharedPostId: "post-1",
        originalAuthorId: "profile-1",
        visibility: "ALL",
        content: { caption: "Sharing this" },
      });
    });
  });
});
