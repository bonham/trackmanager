import { describe, vi, test, expect, afterEach, beforeEach } from "vitest"
import { registerPasskey } from "@/lib/auth/registration"
import * as httpHelpers from "@/lib/httpHelpers"
import * as simpleWebauthn from "@simplewebauthn/browser"
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/browser"

vi.mock("@/lib/httpHelpers")
vi.mock("@simplewebauthn/browser")

const mockGetWithCORS = vi.mocked(httpHelpers.getWithCORS)
const mockSendJSONToServer = vi.mocked(httpHelpers.sendJSONToServer)
const mockGetErrorMessage = vi.mocked(httpHelpers.getErrorMessage)
const mockStartRegistration = vi.mocked(simpleWebauthn.startRegistration)

describe("registerPasskey", () => {
  const registrationKey = "test-reg-key-123"

  const mockRegOptions: PublicKeyCredentialCreationOptionsJSON = {
    challenge: "test-challenge",
    rp: { name: "Test", id: "example.com" },
    user: {
      id: "user-id",
      name: "user@example.com",
      displayName: "Test User"
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    timeout: 60000
  }

  const mockAttestationResponse = {
    id: "credential-id",
    rawId: "cmF3LWlk",
    response: {
      clientDataJSON: "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0=",
      attestationObject: "test-attestation-object",
      transports: ["internal" as const]
    },
    clientExtensionResults: {} as Record<string, unknown>,
    type: "public-key" as const
  } as RegistrationResponseJSON

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

  test("successful registration flow", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerificationResponse)
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(true)
    expect(result.message).toBe("")
    expect(mockGetWithCORS).toHaveBeenCalledWith(`/api/v1/auth/regoptions/regkey/${registrationKey}`)
    expect(mockStartRegistration).toHaveBeenCalledWith({ optionsJSON: mockRegOptions })
    expect(mockSendJSONToServer).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      JSON.stringify(mockAttestationResponse)
    )
  })

  test("fails when regoptions request returns not ok", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: false,
      status: 400
    } as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Registration failed with status 400")
  })

  test("fails when regoptions request throws error", async () => {
    const testError = new Error("Network error")
    mockGetWithCORS.mockRejectedValueOnce(testError)
    mockGetErrorMessage.mockReturnValueOnce("Name: Error, Message: Network error")

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Network error")
  })

  test("fails when regoptions request throws different error type", async () => {
    const customError = { code: 500 }
    mockGetWithCORS.mockRejectedValueOnce(customError)
    mockGetErrorMessage.mockReturnValueOnce("Error: custom error")

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error: custom error")
  })

  test("fails when startRegistration throws InvalidStateError", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    const invalidStateError = new Error("Authenticator was probably already registered")
    Object.defineProperty(invalidStateError, "name", { value: "InvalidStateError" })
    mockStartRegistration.mockRejectedValueOnce(invalidStateError)
    mockGetErrorMessage.mockReturnValueOnce("Name: InvalidStateError, Message: already registered")

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toBe("Authenticator was probably already registered by user")
  })

  test("fails when startRegistration throws other Error instance", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    const otherError = new Error("Some other error")
    mockStartRegistration.mockRejectedValueOnce(otherError)
    mockGetErrorMessage.mockReturnValueOnce("Name: Error, Message: Some other error")

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toBe("Failed on client side")
  })

  test("fails when startRegistration throws non-Error object", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    const customError = { custom: "error" }
    mockStartRegistration.mockRejectedValueOnce(customError)
    mockGetErrorMessage.mockReturnValueOnce("Error object type object")

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toBe("Failed on client side (2)")
  })

  test("fails when verification request returns not ok", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request")
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toBe("Failed")
  })

  test("fails when verification request throws error", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockRejectedValueOnce(new Error("Network error on verification"))

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error when calling registration endpoint")
  })

  test("fails when verification response has verified false", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ verified: false })
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error in verification")
  })

  test("fails when verification response is null", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null)
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error in verification with response body: {}")
  })

  test("fails when verification response is not an object", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve("string response")
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error in verification")
  })

  test("fails when verification response has no verified property", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ someOtherProperty: true })
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Error in verification")
  })

  test("constructs correct registration URL with regkey", async () => {
    const customRegKey = "custom-key-abc123"
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerificationResponse)
    } as unknown as Response)

    await registerPasskey(customRegKey)

    expect(mockGetWithCORS).toHaveBeenCalledWith(`/api/v1/auth/regoptions/regkey/${customRegKey}`)
  })

  test("regoptions request with 404 status", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: false,
      status: 404
    } as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toContain("Registration failed with status 404")
  })

  test("verification response with additional properties", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    const verificationResponseWithExtra = {
      verified: true,
      registrationInfo: { credentialID: "abc123" },
      extraField: "should not matter"
    }

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(verificationResponseWithExtra)
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(true)
    expect(result.message).toBe("")
  })

  test("handles empty registration key", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerificationResponse)
    } as unknown as Response)

    const result = await registerPasskey("")

    expect(mockGetWithCORS).toHaveBeenCalledWith("/api/v1/auth/regoptions/regkey/")
    expect(result.success).toBe(true)
  })

  test("verification request with 500 status", async () => {
    mockGetWithCORS.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRegOptions)
    } as unknown as Response)

    mockStartRegistration.mockResolvedValueOnce(mockAttestationResponse)

    mockSendJSONToServer.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error")
    } as unknown as Response)

    const result = await registerPasskey(registrationKey)

    expect(result.success).toBe(false)
    expect(result.message).toBe("Failed")
  })
})
