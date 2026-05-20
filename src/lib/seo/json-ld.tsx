/**
 * JSON-LD script renderer. Renders one or more schema objects as
 * <script type="application/ld+json"> tags. Safe to use in server components
 * (no client-side JS shipped beyond the inline script tag).
 *
 * Never pass user-derived data through here without sanitization — the
 * payload is rendered via dangerouslySetInnerHTML.
 */

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Escaping </script> tags defensively to prevent breakout if any
          // string field ever ends up containing the closing tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
