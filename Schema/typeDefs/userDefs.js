const { gql } = require("apollo-server-express");

const userType = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    password: String!
    avatar: String
    role: UserRole
    dialCode: String
    phone: String
  }

  type AuthPayload {
    userId: ID!
    userRole: UserRole
    token: String!
    tokenExpiration: Int!
  }

  type OTP {
    otp: String!
    userEmail: String!
    medium: String
    expireAt: String
  }

  enum UserRole {
    Admin
    User
    Editor
    Moderator
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    avatar: String
    role: UserRole = USER
    dialCode: String
    phone: String
  }

  input UpdateUserInput {
    name: String
    password: String
    avatar: String
    dialCode: String
    phone: String
  }

  input UpdateUserRoleInput {
    role: UserRole
  }

  extend type Query {
    listUser: [User!]
    getUser(id: ID!): User
    loginUser(email: String!, password: String!): AuthPayload!
  }

  extend type Mutation {
    getOtp(email: String!): String!
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    updateUserRole(id: ID!, input: UpdateUserRoleInput!): User
    deleteUser(id: ID!): User
  }
`;

module.exports = userType;
