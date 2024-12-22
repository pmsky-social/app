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
