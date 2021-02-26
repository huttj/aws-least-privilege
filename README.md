# AWS Least Privilege
A tool for enforcing least privilege principle for IAM roles.

## Prerequisites
- [AWS Cli](https://aws.amazon.com/cli/) and an [AWS credentials file](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) set up
- [Node.js](https://nodejs.org/en/)

## Usage
1. Find a user or role name to create a policy for. You can browse the most recent events in [the CloudTrail console](https://console.aws.amazon.com/cloudtrail/home?region=us-east-1#/events). (The second half of the "principalId" also works as a username.)
2. Run the script:  
  `AWS_REGION=<us-east-1> AWS_PROFILE=<aws-profile-name> ROLE_NAME=<role-name> npm start`  
  (Replace the items in the angle brackets with the relevant values.)
3. Examine `policy.json`

## Notes
This is a really rough attempt at constructing a policy based on role/user access patterns. There are some key limitations:
- It doesn't pull all events from CloudTrail, just the most recent. This may mean key actions are not included in the policy.
- The approach to constructing the policy is naive – if an ARN can be extracted from the event, it is used as the "resource" to specify for the action. It is also modified to a wildcard ARN, to improve the flexibility of the policy. This may be undesirable. In a future iteration, it may be desirable to prompt the user to:
  1. Use plain wildcards for every action
  2. Use partial wildcards
  3. Prompt on each ARN
- It doesn't validate the output policy, so some adjustment is almost always necessary. In conjunction with the previous issue, sometimes it provides a resource-level permission when only a wildcard is suitable.
