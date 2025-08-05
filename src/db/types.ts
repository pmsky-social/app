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
  LABEL = "label",
  ALLOWED_USER = "allowed_user",
}

export const ALL_PROPOSAL_TYPES = [
  ProposalType.LABEL,
  ProposalType.ALLOWED_USER,
];

export class Proposal {
  rkey!: string; // primary key
  src!: string; // who created the label (always the service act did)
  type!: ProposalType; // label or allowed_user
  val!: string; // the label itself
  subject!: string; // the URI of the resource this label applies to
  createdAt!: string;
  indexedAt!: string;
  indexedBy!: string;
  uri: string;

  constructor(
    rkey: string,
    src: string,
    type: ProposalType,
    val: string,
    subject: string,
    createdAt: string,
    indexedAt: string,
    indexedBy: string,
    uri?: string
  ) {
    this.rkey = rkey;
    this.src = src;
    this.type = type;
    this.val = val;
    this.subject = subject;
    this.createdAt = createdAt;
    this.indexedAt = indexedAt;
    this.indexedBy = indexedBy;
    this.uri = uri || `at://${this.src}/social.pmsky.label/${this.rkey}`;
  }

  static fromDB(row: DatabaseSchema["proposals"]) {
    const {
      rkey,
      src,
      type,
      val,
      subject,
      createdAt,
      indexedAt,
      indexedBy,
      uri,
    } = row;
    return new Proposal(
      rkey,
      src,
      type,
      val,
      subject,
      createdAt,
      indexedAt,
      indexedBy,
      uri
    );
  }
}

export type Post = { uri: string; embed: string };

// this struct only tracks the labels and voters, no vote values or record URIs
export type UserVote = {
  // uri: string; // URI of the vote
  src: string; // who voted
  // val: 1 | -1; // we don't save how they voted in this table
  subject: string; // the URI of the resource this vote applies to
  createdAt: string;
  indexedAt: string;
  indexedBy: string;
};

// this struct more closely matches the ATP records
export type ProposalVote = {
  uri: string; // URI of the vote
  val: 1 | -1; // vote direction
  subject: string; // URI of the proposal voted on
  createdAt: string;
  indexedAt: string;
  indexedBy: string;
};

export function ProposalVoteUri(src: string, rkey: string) {
  return `at://${src}/social.pmsky.vote/${rkey}`;
}

export type AuthSession = { key: string; session: AuthSessionJson };

export type AuthState = { key: string; state: AuthStateJson };

type AuthStateJson = string;

type AuthSessionJson = string;

export type CursorLog = { datetime: number; cursor: number };

export type AllowedUser = { id: number; handle: string };
