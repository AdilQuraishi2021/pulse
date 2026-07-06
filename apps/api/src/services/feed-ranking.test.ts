import { describe, expect, it } from "vitest";
import { getRecommendationScore, getTrendingScore, tokenizeFeedText } from "./feed-ranking";

const now = new Date();

describe("feed ranking", () => {
	it("scores comments higher than likes for trending posts", () => {
		const quietPost = {
			content: "Quiet update",
			createdAt: now,
			likeCount: 1,
			commentCount: 0,
		};
		const activePost = {
			content: "Active update",
			createdAt: now,
			likeCount: 0,
			commentCount: 1,
		};

		expect(getTrendingScore(activePost)).toBeGreaterThan(getTrendingScore(quietPost));
	});

	it("boosts recommended posts that match user interests", () => {
		const interestTerms = new Set(["ai", "writing"]);
		const matchingPost = {
			content: "AI writing tools for social posts",
			createdAt: now,
			likeCount: 0,
			commentCount: 0,
		};
		const unrelatedPost = {
			content: "Weekend cricket plans",
			createdAt: now,
			likeCount: 0,
			commentCount: 0,
		};

		expect(getRecommendationScore(matchingPost, interestTerms)).toBeGreaterThan(
			getRecommendationScore(unrelatedPost, interestTerms),
		);
	});

	it("normalizes hashtags and removes common words", () => {
		expect(tokenizeFeedText("This is about #Programming and AI")).toEqual(["programming"]);
	});
});
