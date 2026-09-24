export interface GitHubRepository {
  owner: string
  repo: string
}

const REPOSITORY_PATTERN = /^[\w.-]+\/[\w.-]+$/

export function parseGitHubRepository(value: string | undefined, fallback: string): GitHubRepository {
  const repository = value?.trim() || fallback

  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new TypeError(`Invalid GitHub repository: ${repository}`)
  }

  const [owner, repo] = repository.split('/')
  return { owner, repo }
}

export function repositoryUrl(repository: GitHubRepository): URL {
  return new URL(`https://github.com/${repository.owner}/${repository.repo}.git`)
}
