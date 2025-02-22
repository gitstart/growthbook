import { ListSdkConnectionsResponse } from "../../../types/openapi";
import {
  findAllSDKConnections,
  findSDKConnectionsByOrganization,
  toApiSDKConnectionInterface,
} from "../../models/SdkConnectionModel";
import {
  applyFilter,
  applyPagination,
  createApiRequestHandler,
  validateIsSuperUserRequest,
} from "../../util/handler";
import { listSdkConnectionsValidator } from "../../validators/openapi";
import { SDKConnectionInterface } from "../../../types/sdk-connection";

export const listSdkConnections = createApiRequestHandler(
  listSdkConnectionsValidator
)(
  async (req): Promise<ListSdkConnectionsResponse> => {
    let connections: SDKConnectionInterface[] = [];

    if (req.query.multiOrg) {
      await validateIsSuperUserRequest(req);
      connections = await findAllSDKConnections();
    } else {
      connections = await findSDKConnectionsByOrganization(req.organization.id);
    }

    const { filtered, returnFields } = applyPagination(
      connections
        .filter(
          (c) =>
            (!req.query.withProxy || c.proxy?.enabled) &&
            applyFilter(req.query.projectId, c.project)
        )
        .filter((c) => {
          if (!req.query.withProxy) return true;
          return c.proxy?.enabled;
        })
        .sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime()),
      req.query
    );

    return {
      connections: filtered.map((connection) =>
        toApiSDKConnectionInterface(connection)
      ),
      ...returnFields,
    };
  }
);
