"use client";

/**
 * Last-resort error boundary. Catches errors that propagate past the root
 * layout (i.e. errors thrown inside the layout itself). Renders its own
 * <html>/<body> because the layout never mounted.
 *
 * Keep this minimal — anything that throws here cannot be caught further up.
 */
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    import("@/lib/logger")
      .then(({ captureException }) =>
        captureException(error, { event: "global_error_boundary", digest: error.digest })
      )
      .catch(() => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "3rem 1.5rem",
          textAlign: "center",
          background: "#08080c",
          color: "#f3f4f6",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ opacity: 0.7, fontSize: "0.875rem" }}>
          Findora hit an unexpected error. Please refresh the page.
        </p>
      </body>
    </html>
  );
}
