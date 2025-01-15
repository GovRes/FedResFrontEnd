import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: "govRezUserData",
    access: (allow) => ({
      "resumes/{entity_id}/*": [
        allow.entity('identity').to(['read', 'write', 'delete'])
      ]
    }),
  });
