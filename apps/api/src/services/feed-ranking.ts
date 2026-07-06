export type RankedFeedPost = {
	content: string;
	createdAt: Date;
	likeCount: number;
	commentCount: number;
};

const STOP_WORDS = new Set([
	"about",
	"after",
	"and",
	"again",
	"also",
	"because",
	"before",
	"being",
	"could",
	"from",
	"have",
	"into",
	"just",
	"like",
	"more",
	"that",
	"their",
	"there",
	"this",
	"with",
	"your",
]);

export function tokenizeFeedText(text: string) {
	return text
		.toLowerCase()
		.split(/[^a-z0-9#]+/)
		.map((word) => word.replace(/^#/, ""))
		.filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export function getTrendingScore(post: RankedFeedPost) {
	const ageHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / 3_600_000);
	const engagementScore = post.likeCount + post.commentCount * 2;
	const recencyBoost = 24 / (ageHours + 24);
	return engagementScore + recencyBoost;
}

export function getRecommendationScore(post: RankedFeedPost, interestTerms: Set<string>) {
	const terms = tokenizeFeedText(post.content);
	const interestScore = terms.filter((term) => interestTerms.has(term)).length * 4;
	const engagementScore = getTrendingScore(post);
	return interestScore + engagementScore;
}
