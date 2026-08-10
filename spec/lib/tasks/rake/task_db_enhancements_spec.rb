require 'rake'
require 'rails_helper'

# The ordering inside db:chatwoot_prepare is load-bearing and invisible: get it
# wrong and a new installation comes up with no first user and no branding,
# while the task itself looks like it merely printed a warning. Nothing about
# the order enforces itself, so it is pinned here.
RSpec.describe Rake::Task do
  describe 'db:chatwoot_prepare' do
    subject(:task) { described_class['db:chatwoot_prepare'] }

    let(:connection) { instance_double(ActiveRecord::ConnectionAdapters::AbstractAdapter) }
    let(:steps) { [] }

    before do
      task.reenable

      allow(ActiveRecord::Base).to receive(:establish_connection)
      allow(ActiveRecord::Base).to receive(:connection).and_return(connection)
      allow(ActiveRecord::Tasks::DatabaseTasks).to receive(:load_schema_current) { steps << :load_schema }

      allow(described_class['db:load_config']).to receive(:invoke)
      allow(described_class['db:create']).to receive(:invoke) { steps << :create }
      allow(described_class['db:migrate']).to receive(:invoke) { steps << :migrate }
      allow(described_class['db:seed']).to receive(:invoke) { steps << :seed }
    end

    context 'when the database exists but is empty' do
      before { allow(connection).to receive(:table_exists?).with('ar_internal_metadata').and_return(false) }

      # The whole point. db:seed calls abort_if_pending_migrations, and the
      # schema dump is older than the newest migration by design, so seeding
      # first aborts every time on a fresh install.
      it 'migrates before it seeds' do
        task.invoke

        expect(steps).to eq(%i[load_schema migrate seed])
      end
    end

    context 'when the database does not exist yet' do
      before do
        allow(connection).to receive(:table_exists?).with('ar_internal_metadata').and_raise(ActiveRecord::NoDatabaseError)
      end

      # This branch used to hand off to db:setup, which seeds before migrating.
      # Fixing only the branch above would have left half the installations
      # broken, and the half that stayed broken is the harder one to diagnose.
      it 'creates the database and prepares it in the same order' do
        task.invoke

        expect(steps).to eq(%i[create load_schema migrate seed])
      end
    end

    context 'when the database is already prepared' do
      before { allow(connection).to receive(:table_exists?).with('ar_internal_metadata').and_return(true) }

      # An upgrade, which is every deploy after the first. Re-seeding a live
      # account is not a no-op.
      it 'migrates without seeding' do
        task.invoke

        expect(steps).to eq(%i[migrate])
      end
    end
  end
end
