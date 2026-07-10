require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const connectDB = require('../config/Database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function main() {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg) {
    console.error('Usage: node findUser.js <email> [password]');
    process.exit(2);
  }

  const email = String(emailArg).toLowerCase().trim();
  const password = typeof passwordArg === 'string' ? String(passwordArg) : undefined;

  try {
    await connectDB();

    const user = await User.findOne({ email }).lean();

    if (!user) {
      console.log(JSON.stringify({ found: false, email }, null, 2));
      process.exit(0);
    }

    const passwordInfo = {
      hasPassword: Boolean(user.password),
      passwordPreview: typeof user.password === 'string' ? user.password.slice(0, 6) + '...' : null,
    };

    let matches = null;
    if (password && user.password) {
      try {
        matches = await bcrypt.compare(password, user.password);
      } catch (e) {
        matches = null;
      }
    }

    console.log(
      JSON.stringify(
        {
          found: true,
          id: String(user._id),
          email: user.email,
          createdAt: user.createdAt,
          passwordInfo,
          passwordMatches: matches,
        },
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
