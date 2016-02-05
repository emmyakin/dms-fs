(function() {
  'use strict';
  var apiTest = require('./specVar');
  var agent = apiTest.agent;
  var assert = require('assert');
  var _ = require('lodash');

  var admin = require('./../../server/config/secret.js')().testAd;
  console.log(admin);
  var userSeed = apiTest.testdata.users;

  var uKey = ['name.first', 'name.last', 'username', 'password',
    'email'
  ];
  var keys = ['label', 'title', 'content', 'groupId', 'ownerId', 'roles'];

  module.exports = function() {
    // seed roles and users
    describe('Admin users CRUD users and documents\n', function() {
      var token, users, ids,
        groupAdmin = {
          'Accept': 'application/json',
          'username': userSeed.groupUsers.tuser2[2],
          'password': userSeed.groupUsers.tuser2[3]
        };

      describe('Group Admin Spec', function() {
        // verify admin login
        it('- Should return a token on Successful login', function(done) {
          agent
            .post('/api/users/login')
            .type('json')
            .send(groupAdmin)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              token = response;
              assert(response.token, 'Token not generated');
              assert.equal(typeof response.expires, 'number');
              assert.equal(response.user.username, 'EAbbott');
              done();
            });
        });
      });

      describe('Retrieve all users, update and delete' +
        ' other users\n',
        function() {
          // should be able to retrieve all user data
          it('- Should be able to retrieve all user data',
            function(done) {
              agent
                .get('/api/users/')
                .set({
                  'Accept': 'application/json',
                  'username': userSeed.groupUsers.tuser2[2],
                  'password': userSeed.groupUsers.tuser2[3],
                  groupid: 113,
                  userid: token.user._id,
                  access_token: token.token
                })
                .type('json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                  assert.equal(null, err, 'Error encountered');
                  var response = res.body;
                  users = response.data;
                  var name = _.pluck(response.data, 'username').slice(0, 4);
                  ids = _.pluck(response.data, '_id')
                  assert.equal(response.message, 'Existing Users');
                  assert.deepEqual(name, ['EAbbott', 'TPerox', 'PNishi',
                    'SPolls'
                  ]);
                  done();
                });
            });

          it('- Should not be able to update other users data', function(done) {
            var userdata = users[1];
            userdata.username = "Altered username"

            agent
              .put('/api/users/' + ids[1])
              .set({
                'Accept': 'application/json',
                'username': userSeed.groupUsers.tuser2[2],
                'password': userSeed.groupUsers.tuser2[3],
                groupid: 113,
                userid: token.user._id,
                access_token: token.token
              })
              .type('json')
              .send(userdata)
              .expect('Content-Type', /json/)
              .expect(403)
              .end(function(err, res) {
                assert.equal(null, err, 'Error encountered');
                var response = res.body;
                assert.equal(response.message, 'Not authorized to update user');
                done();
              });
          });


          // should not be able to delete userdata
          it('- Should not be able to delete userdata', function(done) {
            agent
              .delete('/api/users/' + ids[1])
              .set({
                'Accept': 'application/json',
                'username': userSeed.groupUsers.tuser2[2],
                'password': userSeed.groupUsers.tuser2[3],
                groupid: 113,
                userid: token.user._id,
                access_token: token.token
              })
              .type('json')
              .expect('Content-Type', /json/)
              .expect(403)
              .end(function(err, res) {
                assert.equal(null, err, 'Error encountered');
                var response = res.body;
                assert.equal(response.message, 'Not authorized');
                done();
              });
          });
        });

      //  should be able to get, getall, update and delete all documents in group
      describe('Should be able to CRUD documents\n', function() {

        //  should be able to get all documents
        it('- Should be able to get all document', function(done) {
          agent
            .get('/api/documents')
            .set({
              'Accept': 'application/json',
              'username': userSeed.groupUsers.tuser2[2],
              'password': userSeed.groupUsers.tuser2[3],
              groupid: 113,
              userid: token.user._id,
              access_token: token.token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              var docIds = _.pluck(response.data, '_id');
              assert.equal(response.message, 'Existing Documents');
              assert.deepEqual(docIds, [100, 102, 103]);
              done();
            });
        });

        it('- Should be able to get document by role', function(done) {
          agent
            .get('/api/roles/3/documents')
            .set({
              'Accept': 'application/json',
              'username': userSeed.groupUsers.tuser2[2],
              'password': userSeed.groupUsers.tuser2[3],
              groupid: 113,
              userid: token.user._id,
              access_token: token.token
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              var docbyroleIds = _.pluck(response.data, '_id');
              assert.equal(response.message, 'Document for role-3');
              assert.deepEqual(docbyroleIds, [100, 102, 103]);
              done();
            });
        });

        it('- Should be able to get document by date', function(done) {
          agent
            .get('/api/documents/date')
            .set({
              'Accept': 'application/json',
              'username': userSeed.groupUsers.tuser2[2],
              'password': userSeed.groupUsers.tuser2[3],
              groupid: 113,
              userid: token.user._id,
              access_token: token.token
            })
            .type('json')
            .query({
              'date': new Date().toDateString()
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              var docbydate = _.pluck(response.data, '_id');
              assert.equal(response.message, 'Document for ' +
                new Date().toDateString());
              assert.deepEqual(docbydate, [100, 102, 103]);
              done();
            });
        });

      });

      describe('Super Admin', function() {

        it('- Should be able to update other users data', function(done) {
          var userdata = users[1];
          userdata.username = "Altered username"
          agent
            .put('/api/users/' + ids[1])
            .set({
              'Accept': 'application/json',
              'username': admin.user,
              'password': admin.pw,
              userid: 100,
              access_token: token.token
            })
            .type('json')
            .send(userdata)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              assert.equal(response.message, 'Updated Users');
              assert.equal(response.data.username, 'Altered username');
              done();
            });
        });


        // should be able to delete userdata
        it('- Should  be able to delete userdata', function(done) {
          agent
            .delete('/api/users/' + ids[1])
            .set({
              'Accept': 'application/json',
              'username': admin.user,
              'password': admin.pw,
              userid: 100,
              access_token: token.token
            })
            .type('json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              assert.equal(null, err, 'Error encountered');
              var response = res.body;
              assert.equal(response.message, 'Removed Users');
              done();
            });
        });

      });

    });
  };
})();
