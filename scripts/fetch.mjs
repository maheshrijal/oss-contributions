// Pulls your public PRs to repos you don't own into data/prs.json.
// Needs the `gh` CLI, logged in (locally) or GH_TOKEN set (in CI).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const { user } = JSON.parse(readFileSync("config.json", "utf8"));

const gh = (args) =>
  execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const query = `
query($q: String!, $endCursor: String) {
  search(query: $q, type: ISSUE, first: 100, after: $endCursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        title url number state createdAt mergedAt additions deletions
        repository {
          nameWithOwner url description stargazerCount isPrivate
          owner { login avatarUrl }
          primaryLanguage { name color }
        }
      }
    }
  }
}`;

// `-user:` drops repos you own; `is:public` drops private/work repos.
const q = `author:${user} type:pr is:public -user:${user}`;
const prs = gh([
  "api", "graphql", "--paginate",
  "-f", `query=${query}`, "-f", `q=${q}`,
  "--jq", ".data.search.nodes[]",
])
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((pr) => pr.repository && !pr.repository.isPrivate);

const profile = JSON.parse(
  gh(["api", `users/${user}`, "--jq", "{login,name,bio,avatar_url,html_url}"]),
);

mkdirSync("data", { recursive: true });
writeFileSync(
  "data/prs.json",
  JSON.stringify({ fetchedAt: new Date().toISOString(), profile, prs }, null, 2) + "\n",
);
console.log(`Saved ${prs.length} PRs to data/prs.json`);
