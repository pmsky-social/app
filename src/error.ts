export class InvalidRecord extends Error {
	constructor(recordType: string) {
		super(`Invalid record for type: ${recordType}`);
	}
}

export class ProposalNotFound extends Error {
	constructor(proposalUri: string) {
		super(`URI not found in Proposals table: ${proposalUri}`);
	}
}

export class PostNotFound extends Error {
	constructor(private uri: string) {
		super(`Post not found (uri=${uri})`);
	}
}

export class ProposalExists extends Error {
	existingUri: string;
	constructor(proposalUri: string) {
		super(`Proposal already exists. URI: ${proposalUri}`);
		this.existingUri = proposalUri;
	}
}

export class InvalidVote extends Error {
	constructor(vote: number) {
		super(`Invalid vote value, expected +/- 1: ${vote}`);
	}
}

export class AlreadyVoted extends Error {
	constructor(labelUri: string) {
		super(`User tried to vote twice on label: ${labelUri}`);
	}
}

export class BadRequest extends Error {
	constructor(message: string) {
		super(`Bad request: ${message}`);
	}
}

export class FetchEmbedBadResponse extends Error {
	constructor(private response: Response) {
		super(`Tried to fetch embed, got ${response.status}`);
	}
}

export class EmbedNotAuthorized extends Error {
	constructor(private uri: string) {
		super(`Embed not authorized: ${uri}`);
	}
}
