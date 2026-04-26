import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsView } from "./SettingsView";
import { renderWithClient } from "../../../test/render";
import { server } from "../../../test/server";
import type {
  FileResponse,
  ProfileResponse,
  UserPreferenceResponse,
} from "../types";

const envelope = <T,>(data: T) => ({
  code: 1000,
  message: "success",
  data,
});

const createProfile = (
  overrides: Partial<ProfileResponse> = {},
): ProfileResponse => ({
  id: "profile-1",
  userId: "user-1",
  fullName: "Backend Farmer",
  profilePicture: null,
  avatar: null,
  role: "FARMER",
  specialty: "Coffee",
  certificates: [],
  isVerified: false,
  bio: "Existing backend bio",
  addressLine: "Da Lat",
  provinceCode: "LDG",
  districtCode: "DLT",
  wardCode: "W01",
  latitude: 11.94,
  longitude: 108.44,
  active: true,
  email: "farmer@example.com",
  phoneNumber: "0900000000",
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
  ...overrides,
});

const createPreferences = (
  light = true,
): UserPreferenceResponse => ({
  generalSettings: {
    showAllFriends: false,
    languageEn: false,
  },
  appearanceSettings: {
    theme: light,
  },
});

const uploadedFile: FileResponse = {
  id: "file-1",
  s3Key: "avatars/file-1.png",
  originalFileName: "avatar.png",
  contentType: "image/png",
  fileSize: 42,
  uploadedBy: "user-1",
  active: true,
  createdAt: "2026-04-16T03:00:00Z",
  lastModifiedAt: "2026-04-16T03:00:00Z",
};

const useSettingsHandlers = ({
  profile = createProfile(),
  preferences = createPreferences(),
}: {
  profile?: ProfileResponse;
  preferences?: UserPreferenceResponse;
} = {}) => {
  let currentProfile = profile;
  let currentPreferences = preferences;

  server.use(
    http.get("*/api/profiles/me", () => {
      return HttpResponse.json(envelope(currentProfile));
    }),
    http.put("*/api/profiles/user/:userId", async ({ request }) => {
      const body = (await request.json()) as Partial<ProfileResponse>;
      currentProfile = { ...currentProfile, ...body };
      return HttpResponse.json(envelope(currentProfile));
    }),
    http.get("*/api/preferences/me", () => {
      return HttpResponse.json(envelope(currentPreferences));
    }),
    http.patch("*/api/preferences/appearance", async ({ request }) => {
      const body = (await request.json()) as { theme: boolean };
      currentPreferences = {
        ...currentPreferences,
        appearanceSettings: { theme: body.theme },
      };
      return HttpResponse.json(envelope(currentPreferences));
    }),
    http.get("*/api/files/presigned-url/:fileId", ({ params }) => {
      return HttpResponse.json(
        envelope(`https://files.example.test/${String(params.fileId)}.png`),
      );
    }),
  );
};

describe("SettingsView", () => {
  beforeEach(() => {
    useSettingsHandlers();
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  });

  it("loads backend profile data and renders editable profile fields", async () => {
    renderWithClient(<SettingsView />);

    expect(await screen.findByDisplayValue("Backend Farmer")).toBeEnabled();
    expect(screen.getByDisplayValue("Existing backend bio")).toBeEnabled();
    expect(screen.getByDisplayValue("farmer@example.com")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByDisplayValue("0900000000")).toHaveAttribute("readonly");
  });

  it("submits only editable profile changes to the backend", async () => {
    let updatePayload: unknown = null;

    server.use(
      http.put("*/api/profiles/user/:userId", async ({ request }) => {
        updatePayload = await request.json();
        return HttpResponse.json(
          envelope(
            createProfile({
              fullName: "Updated Farmer",
              bio: "Updated backend bio",
            }),
          ),
        );
      }),
    );

    renderWithClient(<SettingsView />);

    const fullName = await screen.findByLabelText("Full name");
    await userEvent.clear(fullName);
    await userEvent.type(fullName, "Updated Farmer");
    const bio = screen.getByLabelText("Bio");
    await userEvent.clear(bio);
    await userEvent.type(bio, "Updated backend bio");
    await userEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(updatePayload).toEqual({
        fullName: "Updated Farmer",
        bio: "Updated backend bio",
      });
    });
  });

  it("shows profile save success feedback", async () => {
    renderWithClient(<SettingsView />);

    const specialty = await screen.findByLabelText("Specialty");
    await userEvent.clear(specialty);
    await userEvent.type(specialty, "Soil specialist");
    await userEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Profile changes saved.")).toBeInTheDocument();
  });

  it("handles profile save errors gracefully", async () => {
    server.use(
      http.put("*/api/profiles/user/:userId", () => {
        return HttpResponse.json({ message: "Profile update failed" }, { status: 500 });
      }),
    );

    renderWithClient(<SettingsView />);

    const bio = await screen.findByLabelText("Bio");
    await userEvent.clear(bio);
    await userEvent.type(bio, "Broken save");
    await userEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Profile update failed")).toBeInTheDocument();
  });

  it("uploads an avatar through file-service and stores the file id on the profile", async () => {
    let uploadHadFilePart = false;
    let avatarUpdatePayload: unknown = null;
    let avatarProfile = createProfile();

    server.use(
      http.get("*/api/profiles/me", () => {
        return HttpResponse.json(envelope(avatarProfile));
      }),
      http.post("*/api/files/upload", async ({ request }) => {
        const formData = await request.formData();
        uploadHadFilePart = formData.has("file");
        return HttpResponse.json(envelope(uploadedFile), { status: 201 });
      }),
      http.put("*/api/profiles/user/:userId", async ({ request }) => {
        avatarUpdatePayload = await request.json();
        avatarProfile = { ...avatarProfile, avatar: "file-1" };
        return HttpResponse.json(envelope(avatarProfile));
      }),
    );

    renderWithClient(<SettingsView />);

    await screen.findByDisplayValue("Backend Farmer");
    await userEvent.upload(
      screen.getByLabelText("Avatar image file"),
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    expect(await screen.findByText("Avatar uploaded.")).toBeInTheDocument();
    expect(uploadHadFilePart).toBe(true);
    expect(avatarUpdatePayload).toEqual({ avatar: "file-1" });
    await waitFor(() => {
      expect(screen.getByAltText("Profile avatar")).toHaveAttribute(
        "src",
        "https://files.example.test/file-1.png",
      );
    });
  });

  it("handles avatar upload failure gracefully", async () => {
    server.use(
      http.post("*/api/files/upload", () => {
        return HttpResponse.json({ message: "Upload failed" }, { status: 500 });
      }),
    );

    renderWithClient(<SettingsView />);

    await screen.findByDisplayValue("Backend Farmer");
    await userEvent.upload(
      screen.getByLabelText("Avatar image file"),
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
  });

  it("loads backend appearance preference and saves theme changes", async () => {
    let preferencePayload: unknown = null;

    server.use(
      http.patch("*/api/preferences/appearance", async ({ request }) => {
        preferencePayload = await request.json();
        return HttpResponse.json(envelope(createPreferences(false)));
      }),
    );

    renderWithClient(<SettingsView />);

    await screen.findByText("Theme");
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));

    await waitFor(() => {
      expect(preferencePayload).toEqual({ theme: false });
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
    expect(await screen.findByText("Display preferences saved.")).toBeInTheDocument();
  });

  it("shows profile loading state", async () => {
    server.use(
      http.get("*/api/profiles/me", async () => {
        await delay(100);
        return HttpResponse.json(envelope(createProfile()));
      }),
    );

    renderWithClient(<SettingsView />);

    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("uses the active settings API endpoints", async () => {
    const seenEndpoints: string[] = [];

    server.use(
      http.get("*/api/profiles/me", () => {
        seenEndpoints.push("/profiles/me");
        return HttpResponse.json(envelope(createProfile()));
      }),
      http.get("*/api/preferences/me", () => {
        seenEndpoints.push("/preferences/me");
        return HttpResponse.json(envelope(createPreferences()));
      }),
    );

    renderWithClient(<SettingsView />);

    await screen.findByDisplayValue("Backend Farmer");
    expect(seenEndpoints).toEqual(
      expect.arrayContaining(["/profiles/me", "/preferences/me"]),
    );
  });
});
