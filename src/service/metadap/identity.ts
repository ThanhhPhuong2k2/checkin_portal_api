import axios from 'axios';
import { IHttpSettings } from 'interface';

export class IdentityService {
  private http: string;

  constructor(config: IHttpSettings) {
    this.http = config.identityService;
  }

  checkAuthenticate = async (type: 'user' | 'admin', authorization: string) => {
    try {
      const response = await axios.get(`${this.http}/v1/auth/user/${type}`, {
        headers: {
          authorization,
        },
      });

      return response.data;
    } catch (error) {
      return null;
    }
  };

  checkPermissions = async (permissions: string[], authorization: string) => {
    await axios.post(
      `${this.http}/v1/system_users/check_permission`,
      { permissions },
      {
        headers: {
          authorization,
        },
      },
    );
  };

  getLocations = async () => {
    const response = await axios.get<{
      cities: any;
      districts: any;
      wards: any;
    }>(`${this.http}/v1/locations`);

    return response.data;
  };
}
