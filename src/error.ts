export class InvalidRecord extends Error {
  constructor(recordType: string) {
    super(`Invalid record for type: ${recordType}`);
  }
}

export class LabelNotFound extends Error {
  constructor(labelUri: string) {
    super(`URI not found in Labels table: ${labelUri}`);
  }
}

export class LabelExists extends Error {
  existingUri: string;
  constructor(labelUri: string) {
    super(`Label already exists. URI: ${labelUri}`);
    this.existingUri = labelUri;
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
