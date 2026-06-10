import { describe, expect, it } from "vitest";
import { buildMessageBody } from "./graphClient";
import { Payload } from "./messageContent";

describe("buildMessageBody", () => {
  it("serializes quick replies as content_type=text entries", () => {
    const body = buildMessageBody({
      text: "Usage rights?",
      quickReplies: [
        { title: "None", payload: Payload.USAGE_NONE },
        { title: "30-day", payload: Payload.USAGE_30 },
      ],
    });
    expect(body).toEqual({
      text: "Usage rights?",
      quick_replies: [
        { content_type: "text", title: "None", payload: Payload.USAGE_NONE },
        { content_type: "text", title: "30-day", payload: Payload.USAGE_30 },
      ],
    });
  });

  it("serializes buttons as a button template attachment", () => {
    const body = buildMessageBody({
      text: "Estimated rate: $500.00",
      buttons: [
        { type: "postback", title: "Submit", payload: Payload.SUBMIT },
        { type: "postback", title: "Edit", payload: Payload.EDIT },
      ],
    });
    expect(body).toEqual({
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Estimated rate: $500.00",
          buttons: [
            { type: "postback", title: "Submit", payload: Payload.SUBMIT },
            { type: "postback", title: "Edit", payload: Payload.EDIT },
          ],
        },
      },
    });
  });

  it("prefers quick replies over buttons when both are present", () => {
    const body = buildMessageBody({
      text: "hi",
      quickReplies: [{ title: "Start", payload: Payload.START }],
      buttons: [{ type: "postback", title: "Submit", payload: Payload.SUBMIT }],
    });
    expect(body).toHaveProperty("quick_replies");
    expect(body).not.toHaveProperty("attachment");
  });

  it("falls back to a plain text body with no chips/buttons", () => {
    expect(buildMessageBody({ text: "One sec…" })).toEqual({ text: "One sec…" });
  });
});
