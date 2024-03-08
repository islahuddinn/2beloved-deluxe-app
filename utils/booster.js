// Function to prioritize boosted profiles in search results or other listings
function prioritizeBoostedProfiles(profiles) {
  return profiles.sort((a, b) => {
    const boostFactorA = a.isBoosted && a.boostExpiresAt > new Date() ? 1.5 : 1; // Adjust boost factor as needed
    const boostFactorB = b.isBoosted && b.boostExpiresAt > new Date() ? 1.5 : 1; // Adjust boost factor as needed

    // Combine boost factor with other ranking factors (e.g., relevance score)
    const combinedScoreA = boostFactorA * a.relevanceScore;
    const combinedScoreB = boostFactorB * b.relevanceScore;

    return combinedScoreB - combinedScoreA; // Descending order (higher score comes first)
  });
}
export default prioritizeBoostedProfiles();

// /////// Another scenario for profile booster
// const prioritizeBoostedProfiles = async (query) => {
//   // Query database to retrieve search results
//   const searchResults = await User.find(query);

//   // Sort search results based on boost status and expiration date
//   const sortedResults = searchResults.sort((a, b) => {
//     if (a.isBoosted && !b.isBoosted) return -1; // Boosted profiles first
//     if (!a.isBoosted && b.isBoosted) return 1; // Non-boosted profiles later
//     // If both profiles are boosted, prioritize by boost end date
//     return a.boostEndDate - b.boostEndDate;
//   });

//   return sortedResults;
// };
