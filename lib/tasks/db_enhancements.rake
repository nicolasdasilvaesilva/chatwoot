# We are hooking config loader to run automatically everytime migration is executed
Rake::Task['db:migrate'].enhance do
  if ActiveRecord::Base.connection.table_exists? 'installation_configs'
    puts 'Loading Installation config'
    ConfigLoader.new.process
  end
end

# we are creating a custom database prepare task
# the default rake db:prepare task isn't ideal for environments like heroku
# In heroku the database is already created before the first run of db:prepare
# In this case rake db:prepare tries to run db:migrate from all the way back from the beginning
# Since the assumption is migrations are only run after schema load from a point x, this could lead to things breaking.
# ref: https://github.com/rails/rails/blob/main/activerecord/lib/active_record/railties/databases.rake#L356
db_namespace = namespace :db do
  desc 'Runs setup if database does not exist, or runs migrations if it does'
  task chatwoot_prepare: :load_config do
    ActiveRecord::Base.configurations.configs_for(env_name: Rails.env).each do |db_config|
      ActiveRecord::Base.establish_connection(db_config.configuration_hash)

      # Two shapes of a brand new installation: no database at all, or one that
      # exists and is empty. Creating the missing one lands us on the second,
      # so both go on to be prepared by the same three steps below — the old
      # code sent this branch to db:setup, which seeds before migrating and so
      # carried the very ordering problem the lines below exist to avoid.
      fresh_install =
        begin
          !ActiveRecord::Base.connection.table_exists?('ar_internal_metadata')
        rescue ActiveRecord::NoDatabaseError
          db_namespace['create'].invoke
          true
        end

      if fresh_install
        db_namespace['load_config'].invoke if ActiveRecord.schema_format == :ruby
        ActiveRecord::Tasks::DatabaseTasks.load_schema_current(:ruby, ENV.fetch('SCHEMA', nil))
      end

      # Migrate before seeding. db:seed aborts outright when a migration is
      # pending, so the old order held only while the schema dump happened to
      # be as new as the newest migration — true today, and untrue the moment
      # one lands without the dump being regenerated. What it costs when it
      # breaks is not proportional to the cause: no seed means no onboarding
      # key in Redis, so there is no way to create the first user, and the task
      # dies before branding and the logos.
      db_namespace['migrate'].invoke
      db_namespace['seed'].invoke if fresh_install
    end
  end
end
