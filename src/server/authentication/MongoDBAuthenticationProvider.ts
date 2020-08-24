import {
  AuthenticationProvider,
  AuthenticationResult,
} from "./AuthenticationProvider";
import MongoDBPersister from "../database/MongoDBPersister";

export default class MongoDBAuthenticationProvider
  implements AuthenticationProvider {
  private persister: MongoDBPersister;

  constructor(persister: MongoDBPersister) {
    this.persister = persister;
  }

  async authenticateUser(
    username: string,
    password: string
  ): Promise<AuthenticationResult> {
    const user = await this.persister.GetUserAccount(username);
    if (user.password === password) {
      return { username: "", token: "", type: "mongodb" };
    }
    throw new Error("AuthenticationError");
  }
}
