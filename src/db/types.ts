export type DatabaseSchema = {
  proposals: Proposal;
  posts: Post;
  user_votes: UserVote; // keeps track of which users voted
  proposal_votes: ProposalVote; // keeps track of vote values, these are separate for anonymity
  auth_session: AuthSession;
  auth_state: AuthState;
  cursor_log: CursorLog;
  allowed_users: AllowedUser;
};

export enum ProposalType {
  POST_LABEL = "post_label",
  ALLOWED_USER = "allowed_user",
}

export class Proposal {
  rkey!: string; // primary key
  src!: string; // who created the label (always the service act did)
  type!: ProposalType;
  val!: string; // the label itself
  subject!: string; // the URI of the resource this label applies to
  createdAt!: string;
  indexedAt!: string;

  uri(): string {
    return `at://${this.src}/social.pmsky.label/${this.rkey}`;
  }
}

export type Post = {
  uri: string;
  embed: string;
};

// this struct only tracks the labels and voters, no vote values or record URIs
export type UserVote = {
  // uri: string; // URI of the vote
  src: string; // who voted
  // val: 1 | -1; // we don't save how they voted in this table
  subject: string; // the URI of the resource this vote applies to
  createdAt: string;
  indexedAt: string;
};

// this struct more closely matches the ATP records
export type ProposalVote = {
  uri: string; // URI of the vote
  val: 1 | -1; // vote direction
  subject: string; // URI of the label voted on
  createdAt: string;
  indexedAt: string;
};

export type AuthSession = {
  key: string;
  session: AuthSessionJson;
};

export type AuthState = {
  key: string;
  state: AuthStateJson;
};

type AuthStateJson = string;

type AuthSessionJson = string;

export type CursorLog = {
  datetime: number;
  cursor: number;
};

export type AllowedUser = {
  id: number;
  handle: string;
};
