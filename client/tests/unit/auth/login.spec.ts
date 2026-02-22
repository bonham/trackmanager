import { describe, vi, test, expect, afterEach, beforeEach } from "vitest"
import { performWebauthnLogin } from "@/lib/auth/login"
import * as httpHelpers from "@/lib/httpHelpers"
import * as simpleWebauthn from "@simplewebauthn/browser"
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser"

vi.mock("@/lib/httpHelpers")
vi.mock("@simplewebauthn/browser")

const mockGetWithCORS = vi.mocked(httpHelpers.getWithCORS)
const mockSendJSONToServer = vi.mocked(httpHelpers.sendJSONToServer)
const mockGetErrorMessage = vi.mocked(httpHelpers.getErrorMessage)
const mockStartAuthentication = vi.mocked(simpleWebauthn.startAuthentication)

describe("performWebauthnLogin", () => {
  const mockAuthOptions = {
    challenge: "test-challenge",
    timeout: 60000,
    rpId: "example.com",
    userVerification: "preferred"
  } as unknown as PublicKeyCredentialCreationOptionsJSON

  const mockAssertionResponse = {
    id: "credential-id",
    rawId: "cmF3LWlk",
    response: {
      clientDataJSON: "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=",
      authenticatorData: "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmDFWfKVBoscBAAAAA",
      signature: "test-signature"
    },
    clientExtensionResults: {} as Record<string, unknown>,
    type: "public-key" as const
  }

  const mockVerificationResponse = {
    verified: true,
    registrationInfo: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetErrorMessage.mockImplementation((error) => {
      if (error instanceof Error) {
        return `Name: ${error.name}, Message: ${error.message}`
      }
      return `Error: ${String(error)}`
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test("successful login flow", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerificationResponse)
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(true)
    expect(result.message).toBe("")
    expect(result.errorId).toBeUndefined()
    expect(mockGetWithCORS).toHaveBeenCalledWith("/api/v1/auth/authoptions")
    expect(mockStartAuthentication).toHaveBeenCalledWith({ optionsJSON: mockAuthOptions })
    expect(mockSendJSONToServer).toHaveBeenCalledWith(
      "/api/v1/auth/authentication",
      JSON.stringify(mockAssertionResponse)
    )
  })

  test("fails when authoptions request returns not ok", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error")
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Http status: 500")
    expect(result.message).toContain("Internal Server Error")
  })

  test("fails when authoptions request throws error", async () => {
    const testError = new Error("Network error")
    mockGetWithCORS.mockRejectedValueOnce(testError)
    mockGetErrorMessage.mockReturnValueOnce("Name: Error, Message: Network error")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Network error")
  })

  test("fails when startAuthentication throws NotAllowedError", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    const notAllowedError = new Error("User cancelled")
    Object.defineProperty(notAllowedError, "name", { value: "NotAllowedError" })
    mockStartAuthentication.mockRejectedValueOnce(notAllowedError)
    mockGetErrorMessage.mockReturnValueOnce("Name: NotAllowedError, Message: User cancelled")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.errorId).toBe("NotAllowedError")
    expect(result.message).toContain("User cancelled")
  })

  test("fails when startAuthentication throws other error", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    const otherError = new Error("Authenticator not available")
    mockStartAuthentication.mockRejectedValueOnce(otherError)
    mockGetErrorMessage.mockReturnValueOnce("Name: Error, Message: Authenticator not available")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.errorId).toBeUndefined()
    expect(result.message).toContain("Authenticator not available")
  })

  test("fails when verification request returns 401", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: false,
      status: 401
    } as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toBe("You are not authorized. Try another passkey")
  })

  test("fails when verification request returns non-401 error", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Sorry, something went wrong")
    expect(result.message).toContain("500")
  })

  test("fails when verification response has verified false", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ verified: false })
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Oh no, something went wrong")
  })

  test("fails when verification response is null", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null)
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Oh no, something went wrong")
  })

  test("fails when verification response is not an object", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve("string response")
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Oh no, something went wrong")
  })

  test("fails when verification response has no verified property", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ someOtherProperty: true })
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Oh no, something went wrong")
  })

  test("handles error object without Error instance", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    const customError = { custom: "error" }
    mockStartAuthentication.mockRejectedValueOnce(customError)
    mockGetErrorMessage.mockReturnValueOnce("Error object type object, Value: [object Object]")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error object type")
  })

  test("handles error with name property but not NotAllowedError", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    const errorWithName = { name: "SomeOtherError", message: "test" }
    mockStartAuthentication.mockRejectedValueOnce(errorWithName)
    mockGetErrorMessage.mockReturnValueOnce("Error: some error message")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.errorId).toBeUndefined()
  })

  test("authoptions request with 404 status", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found")
    } as unknown as Response)

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Http status: 404")
    expect(result.message).toContain("Not Found")
  })

  test("verification request throws error", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuthOptions)
    } as unknown as Response)

    mockStartAuthentication.mockResolvedValueOnce(mockAssertionResponse)

    const verificationError = new Error("Network error on verification")
    mockSendJSONToServer.mockRejectedValueOnce(verificationError)
    mockGetErrorMessage.mockReturnValueOnce("Name: Error, Message: Network error on verification")

    const result = await performWebauthnLogin()

    expect(result.success).toBe(false)
    expect(result.message).toContain("Network error")
  })
})
