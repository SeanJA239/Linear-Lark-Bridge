import { Button } from "@base-ui/react/button";
import * as stylex from "@stylexjs/stylex";
import { login } from "./lib/auth";
import { button } from "./theme/shared";
import { colors } from "./theme/tokens.stylex";
import { typo } from "./theme/typography";

const s = stylex.create({
  login: {
    maxWidth: "23rem",
    margin: "7rem auto",
    textAlign: "center",
  },
  title: {
    marginBottom: "0.5rem",
  },
  tagline: {
    color: colors.muted,
  },
  // The login CTA is the shared primary button, roomier and pushed clear of
  // the tagline.
  cta: {
    marginTop: "2rem",
    padding: "0.6rem 1.4rem",
  },
});

export function Login() {
  return (
    <main {...stylex.props(s.login)}>
      <h1 {...stylex.props(s.title)}>larkstack console</h1>
      <p {...stylex.props(typo.body, s.tagline)}>
        Sign in with your Lark account to continue.
      </p>
      <Button
        className={stylex.props(button.primary, s.cta).className}
        type="button"
        onClick={login}
      >
        Sign in with Lark
      </Button>
    </main>
  );
}
