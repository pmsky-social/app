# pmsky-app

See [pmsky.social](http://pmsky.social)

This repository is based off of the [statusphere example app](https://github.com/bluesky-social/statusphere-example-app/tree/main),
and defines the main platform of PMsky.

It allows users to login via ATProto, create labels, and vote on those labels.
Each vote is an AT proto record, published anonymously to the @pmsky.social PDS.

## lexicon

PMsky leverages existing lexicons for labels, and introduces a new lexicon for a "vote" (`social.pmsky.vote`).

## Where do new records go?

When a user creates a label, PMsky publishes the record to its own PDS.  These labels are therefore not owned by any one account.  
This means that you cannot delete a label once you create it.

Votes are also stored in the pmsky.social PDS, for users' privacy.  Public votes (storing them in a user's own PDS) will be implemented eventually.

PMsky, for now, only stores *whether a user voted on a certain label*, rather than storing how they voted.  
This means that you cannot change your vote once you've cast it.

## Current status:
- [x] create a label
- [x] vote on a label
    - [ ] lexicon
    - [x] UI
    - [x] routes
- [ ] better label UI (show actual post, context?)
    - [x] show label score
    - [ ] show number of votes too?
    - [ ] render post when creating a label
- [ ] separate posts table to store embeds (to avoid storing dups)
- [ ] refactor as more MVC
- [ ] some testing framework? cypress? screenshots?
- [x] records are published to at proto in the service acct's PDS 
- [x] watch the firehose for labels published to pmsky pds
- [~] create a generic "server message" thing to handle responses.  maybe end up using more ajax calls than plain html
- [ ] hydration so voting only refreshes that label component, rather than the whole page.
- [ ] sorting existing labels
- [x] when creating a label, if it already exists, gracefully link to the existing label rather than creating a duplicate
- [ ] messaging around how labels don't belong to you, and cannot be deleted
- [ ] settings page for vote publicity
- [ ] allow public votes (published to user's own PDS)