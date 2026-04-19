import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { SearchPage } from "./SearchPage";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  SearchPostItem,
  SearchProfileItem,
  SearchSpringPage,
} from "../types";

const postResult: SearchPostItem = {
  id: "post-1",
  authorId: "profile-1",
  authorInfo: {
    id: "profile-1",
    fullName: "Backend Farmer",
    avatar: "https://example.com/avatar.png",
    role: "USER",
    isVerified: true,
  },
  title: "Coffee leaf issue",
  caption: "Coffee leaves show yellow spots after rain",
  hashtags: ["#coffee", "#leaf"],
  postType: "FEED",
  upvoteCount: 12,
  commentCount: 3,
  uploadedAt: "2026-04-16T03:00:00Z",
  current: null,
};

const profileResult: SearchProfileItem = {
  id: "profile-2",
  userId: "user-2",
  fullName: "Backend Expert",
  profilePicture: null,
  avatar: "https://example.com/expert.png",
  role: "EXPERT",
  specialty: "Plant disease",
  isVerified: true,
  bio: "Coffee disease specialist",
  addressLine: "Da Lat",
  provinceCode: null,
  districtCode: null,
  wardCode: null,
  latitude: null,
  longitude: null,
};

const springPage = <T,>(
  content: T[],
  page = 0,
  totalElements = content.length,
): SearchSpringPage<T> => ({
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

const renderSearchRoute = (route = "/dashboard/search") =>
  renderWithClient(
    <Routes>
      <Route path="/dashboard/search" element={<SearchPage />} />
      <Route path="/dashboard/community" element={<LocationProbe />} />
    </Routes>,
    { route },
  );

function LocationProbe() {
  const location = useLocation();
  return <div>Current path: {location.pathname + location.search}</div>;
}

describe("SearchPage", () => {
  it("renders the search page", () => {
    renderSearchRoute();

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search keyword")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Posts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profiles" })).toBeInTheDocument();
  });

  it("debounces post search requests while typing", async () => {
    const seenTerms: string[] = [];

    server.use(
      http.get("*/api/search/posts/search", ({ request }) => {
        const url = new URL(request.url);
        seenTerms.push(url.searchParams.get("searchTerm") || "");
        return HttpResponse.json(envelope(springPage([postResult])));
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "coffee");

    await waitFor(
      () => {
        expect(seenTerms).toEqual(["coffee"]);
      },
      { timeout: 1200 },
    );
    expect(
      await screen.findByText("Coffee leaves show yellow spots after rain"),
    ).toBeInTheDocument();
  });

  it("switches to profile search with the current keyword", async () => {
    let profileSearchTerm: string | null = null;

    server.use(
      http.get("*/api/search/posts/search", () => {
        return HttpResponse.json(envelope(springPage([postResult])));
      }),
      http.get("*/api/search/profiles/search", ({ request }) => {
        const url = new URL(request.url);
        profileSearchTerm = url.searchParams.get("searchTerm");
        return HttpResponse.json(envelope(springPage([profileResult])));
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "coffee");
    await screen.findByText("Coffee leaves show yellow spots after rain");
    await userEvent.click(screen.getByRole("button", { name: "Profiles" }));

    expect(await screen.findByText("Backend Expert")).toBeInTheDocument();
    expect(profileSearchTerm).toBe("coffee");
    expect(screen.getByText("Coffee disease specialist")).toBeInTheDocument();
    expect(
      screen.getByText(/Profile detail navigation is not available yet/i),
    ).toBeInTheDocument();
  });

  it("shows loading state when a search is in flight", async () => {
    server.use(
      http.get("*/api/search/posts/search", async () => {
        await delay(150);
        return HttpResponse.json(envelope(springPage([postResult])));
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "leaf");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByLabelText("Loading search results")).toBeInTheDocument();
    expect(
      await screen.findByText("Coffee leaves show yellow spots after rain"),
    ).toBeInTheDocument();
  });

  it("shows empty state when no results exist", async () => {
    server.use(
      http.get("*/api/search/posts/search", () => {
        return HttpResponse.json(envelope(springPage([])));
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "none");

    expect(await screen.findByText("No posts found")).toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    server.use(
      http.get("*/api/search/posts/search", () => {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "error");

    expect(
      await screen.findByText("Search results could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("paginates backend search results", async () => {
    const seenPages: string[] = [];

    server.use(
      http.get("*/api/search/posts/search", ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || "0";
        seenPages.push(page);
        return HttpResponse.json(
          envelope(
            springPage(
              [
                {
                  ...postResult,
                  id: `post-page-${page}`,
                  caption: `Page ${Number(page) + 1} result`,
                },
              ],
              Number(page),
              11,
            ),
          ),
        );
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "coffee");
    expect(await screen.findByText("Page 1 result")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Next search page"));

    expect(await screen.findByText("Page 2 result")).toBeInTheDocument();
    expect(seenPages).toContain("1");
  });

  it("post result navigation uses the community fallback query param", async () => {
    server.use(
      http.get("*/api/search/posts/search", () => {
        return HttpResponse.json(envelope(springPage([postResult])));
      }),
    );

    renderSearchRoute();

    await userEvent.type(screen.getByLabelText("Search keyword"), "coffee");
    await userEvent.click(
      await screen.findByRole("link", {
        name: /Backend Farmer.*Coffee leaves show yellow spots after rain/s,
      }),
    );

    expect(
      await screen.findByText("Current path: /dashboard/community?post=post-1"),
    ).toBeInTheDocument();
  });
});
