module.exports = function createPolicyFromEvents(trail) {
  const events = trail.Events;

  const map = Object.values(
    events.map(n => {
      return {
        Action: n.EventSource.split('.')[0] + ':' + n.EventName,
        Effect: 'Allow',
        Resource: extractResources(n),
      };
    })
      .reduce((acc, n) => {
        acc[n.Action] = acc[n.Action] || {
          ...n,
          Resource: new Set(),
        };

        n.Resource.forEach(r => acc[n.Action].Resource.add(r));

        return acc;
      }, {})
  );

  map.forEach(n => n.Resource = Array.from(n.Resource));

  const wildcard = [];
  const other = [];

  for (const policy of map) {
    if (policy.Resource.includes('*')) {
      wildcard.push(policy.Action);
      if (policy.Resource.length > 1) {
        other.push({
          ...policy,
          Resource: policy.Resource.filter(n => n != '*'),
        });
      }
    } else {
      other.push(policy);
    }
  }

  let byResource = {};
  for (const p of other) {
    if (p.Resource.length === 1) {
      byResource[p.Resource] = (byResource[p.Resource] || []).concat(p.Action);
    }
  }

  const policy = {
    "Version": "2012-10-17",
    "Statement": Object.keys(byResource).map(resource => ({
      Action: byResource[resource],
      Effect: 'Allow',
      Resource: resource,
    })).concat({
      Action: wildcard,
      Effect: 'Allow',
      Resource: '*'
    }),
  }

  return policy;


}


function extractResources(cloudTrailEntry) {

  let {
    CloudTrailEvent,
    Resources,
  } = cloudTrailEntry;

  const resources = new Set();
  resources.add('*');

  getResourcesFromCloudTrailEvent(CloudTrailEvent)
    .map(r => resources.add(r));

  Resources.forEach(n => {
    resources.add(resourceToGeneric(n.ResourceName));
  });

  return Array.from(resources).map(n => n);
}

function resourceToGeneric(resource) {
  if (!resource) {
    return null;
  }
  // arn:aws:kms:us-east-2:594342711253:key/68b29773-50ba-4bfc-a196-bd08c1b660b1
  // console.log(resource);
  try {
    const match = resource.match(/arn:aws:(?<service>[^:]+):(?<region>[^:]*):(?<accountNumber>[^:]+):(?<type>[^\/]+)\/?(?<entity>.*)/);
    const { service, entity, type } = match.groups;
    return `arn:aws:${service}:*:594342711253:${entity ? type : '*'}${entity ? '/*' : ''}`;
  } catch (e) {
    console.warn(`${e.message} - From resource: ${resource}`);
    return '*';
  }
}


function findArn(object) {
  try {
    for (const key in object) {
      const val = object[key];
      if (typeof val === 'string' && val.match(/^arn:aws:/)) {
        return val;
      }
    }
    // console.warn('Could not find ARN in', object);
    return null;
  } catch (e) {
    return null;
  }
}



function getResourcesFromCloudTrailEvent(CloudTrailEvent) {
  // const log = (...args) => console.log('CloudTrailEvent:', ...args);
  const log = () => { };
  const resources = new Set();

  try {

    if (typeof CloudTrailEvent === 'string') {
      CloudTrailEvent = JSON.parse(CloudTrailEvent);
    } else {
      log('NOT string')
    }

    if (CloudTrailEvent.resources) {
      log('has resources')
      CloudTrailEvent.resources.forEach(n => resources.add(resourceToGeneric(n.ARN)));
    }

    const arn = findArn(CloudTrailEvent.requestParameters);

    if (arn) {
      log(arn ? 'has' : 'does not have', 'params');
    }

    resources.add(resourceToGeneric(arn))

  } catch (e) {
    log('Something failed', e);
    // Didn't get CloudTrail event
    return [];
  }

  return Array.from(resources).filter(n => n);
}