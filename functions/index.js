// Firestore trigger to update status when votes change
exports.updateBrandStatus = functions.firestore
    .document("Brands/{brandId}")
    .onWrite(async (change, context) => {
        const brandRef = change.after.ref;
        const brandData = change.after.data();

        if (!brandData || !brandData.votes) return null;

        const upvotes = brandData.votes.upvotes || 0;
        const downvotes = brandData.votes.downvotes || 0;
        const netVotes = upvotes - downvotes;

        let status;
        if (netVotes > 5) {
            status = "Pro-Democracy";
        } else if (netVotes >= 0) {
            status = "Inconclusive";
        } else {
            status = "Pro-Trump";
        }

        return brandRef.update({ status });