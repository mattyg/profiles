import { Config, InstallAgentsHapps, Orchestrator } from "@holochain/tryorama";
import Base64 from "js-base64";
import path from "path";

const conductorConfig = Config.gen();

// Construct proper paths for your DNAs
const profilesDna = path.join(__dirname, "../../workdir/dna/profiles-test.dna");

// create an InstallAgentsHapps array with your DNAs to tell tryorama what
// to install into the conductor.
const installation: InstallAgentsHapps = [
  // agent 0
  [
    // happ 0
    [profilesDna],
  ],
  [
    // happ 0
    [profilesDna],
  ],
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));

function serializeHash(hash) {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

let orchestrator = new Orchestrator();

orchestrator.registerScenario("create a profile and get it", async (s, t) => {
  const [alice, bob] = await s.players([conductorConfig]);

  // install your happs into the coductors and destructuring the returned happ data using the same
  // array structure as you created in your installation array.
  const [[alice_profiles], [bob_profiles]] = await alice.installAgentsHapps(
    installation
  );

  let alicePubkeyB64 = serializeHash(alice_profiles.agent);
  let bobPubKeyB64 = serializeHash(bob_profiles.agent);

  let myProfile = await alice_profiles.cells[0].call(
    "profiles",
    "get_my_profile",
    null
  );
  t.notOk(myProfile);

  let profileHash = await alice_profiles.cells[0].call(
    "profiles",
    "create_profile",
    {
      nickname: "alice",
      fields: {
        avatar: "aliceavatar",
      },
    }
  );
  t.ok(profileHash);

  await sleep(500);

  profileHash = await bob_profiles.cells[0].call("profiles", "create_profile", {
    nickname: "bobbo",
    fields: {
      avatar: "bobboavatar",
    },
  });
  t.ok(profileHash);

  await sleep(5000);

  myProfile = await alice_profiles.cells[0].call(
    "profiles",
    "get_my_profile",
    null
  );
  t.ok(myProfile.agent_pub_key);
  t.equal(myProfile.profile.nickname, "alice");

  let allprofiles = await bob_profiles.cells[0].call(
    "profiles",
    "get_all_profiles",
    null
  );
  t.equal(allprofiles.length, 2);

  let multipleProfiles = await bob_profiles.cells[0].call(
    "profiles",
    "get_agents_profile",
    [alicePubkeyB64, bobPubKeyB64]
  );
  t.equal(multipleProfiles.length, 2);

  let profiles = await bob_profiles.cells[0].call(
    "profiles",
    "search_profiles",
    {
      nickname_prefix: "sdf",
    }
  );
  t.equal(profiles.length, 0);

  profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
    nickname_prefix: "alic",
  });
  t.equal(profiles.length, 1);
  t.ok(profiles[0].agent_pub_key);
  t.equal(profiles[0].profile.nickname, "alice");

  profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
    nickname_prefix: "ali",
  });
  t.equal(profiles.length, 1);
  t.ok(profiles[0].agent_pub_key);
  t.equal(profiles[0].profile.nickname, "alice");
  t.equal(profiles[0].profile.fields.avatar, "aliceavatar");

  profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
    nickname_prefix: "alice",
  });
  t.equal(profiles.length, 1);
  t.ok(profiles[0].agent_pub_key);
  t.equal(profiles[0].profile.nickname, "alice");

  profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
    nickname_prefix: "bob",
  });
  t.equal(profiles.length, 1);
  t.ok(profiles[0].agent_pub_key);
  t.equal(profiles[0].profile.nickname, "bobbo");
  t.equal(profiles[0].profile.fields.avatar, "bobboavatar");
});

orchestrator.run();
orchestrator = new Orchestrator();

orchestrator.registerScenario(
  "create a profile with upper case and search it with lower case",
  async (s, t) => {
    const [alice, bob] = await s.players([conductorConfig]);

    // install your happs into the coductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    const [[alice_profiles], [bob_profiles]] = await alice.installAgentsHapps(
      installation
    );

    let profileHash = await alice_profiles.cells[0].call(
      "profiles",
      "create_profile",
      {
        nickname: "ALIce",
        fields: {
          avatar: "aliceavatar",
        },
      }
    );
    t.ok(profileHash);
    await sleep(5000);

    let profiles = await bob_profiles.cells[0].call(
      "profiles",
      "search_profiles",
      {
        nickname_prefix: "ali",
      }
    );
    t.equal(profiles.length, 1);
    t.ok(profiles[0].agent_pub_key);
    t.equal(profiles[0].profile.nickname, "ALIce");

    profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
      nickname_prefix: "aLI",
    });
    t.equal(profiles.length, 1);
    t.ok(profiles[0].agent_pub_key);
    t.equal(profiles[0].profile.nickname, "ALIce");

    profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
      nickname_prefix: "AlI",
    });
    t.equal(profiles.length, 1);
    t.ok(profiles[0].agent_pub_key);
    t.equal(profiles[0].profile.nickname, "ALIce");

    profiles = await bob_profiles.cells[0].call("profiles", "search_profiles", {
      nickname_prefix: "ALI",
    });
    t.equal(profiles.length, 1);
    t.ok(profiles[0].agent_pub_key);
    t.equal(profiles[0].profile.nickname, "ALIce");
  }
);

orchestrator.run();
