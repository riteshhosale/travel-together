require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const connectDB = require('../config/Database');
const User = require('../models/User');

async function main() {
  const [, , patternArg] = process.argv;
  if (!patternArg) {
    console.error('Usage: node searchUsers.js <pattern>');
    process.exit(2);
  }

  const pattern = patternArg;

  try {
    await connectDB();

    const regex = new RegExp(pattern, 'i');
    const users = await User.find({ $or: [{ email: regex }, { name: regex }] })
      .limit(20)
      .lean();

    console.log(
      JSON.stringify(
        users.map((u) => ({
          id: String(u._id),
          email: u.email,
          name: u.name,
          createdAt: u.createdAt,
        })),
        null,
        2
      )
    );
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try {
      await connectDB.closeDB();
    } catch (_) {}
  }
}

main();
