import dotenv from "dotenv";
import { bool, cleanEnv, host, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
	NODE_ENV: str({
		devDefault: testOnly("test"),
		choices: ["development", "production", "test"],
	}),
	HOST: host({ devDefault: testOnly("localhost") }),
	PORT: port({ devDefault: testOnly(3000) }),
	PUBLIC_URL: str({}),
	DB_PATH: str({ devDefault: ":memory:" }),
	COOKIE_SECRET: str({ devDefault: "00000000000000000000000000000000" }),
	LOG_LEVEL: str({ devDefault: "info" }),
	PUBLISH_TO_ATPROTO: bool({ devDefault: false }),
	SVC_ACT_DID: str({ devDefault: "" }),
	SVC_ACT_EMAIL: str({ devDefault: "" }),
	SVC_ACT_APP_PW: str({ devDefault: "" }),
});

export type Environment = typeof env;
