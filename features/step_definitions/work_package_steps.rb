# encoding: utf-8

#-- copyright
# OpenProject is a project management system.
#
# Copyright (C) 2012-2013 the OpenProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require "rack_session_access/capybara"

Given /^the work package "(.*?)" has the following children:$/ do |work_package_subject, table|
  parent = WorkPackage.find_by_subject(work_package_subject)
  
  table.raw.flatten.each do |child_subject|
    child = WorkPackage.find_by_subject(child_subject)

    if child.is_a? Issue
      child.parent_issue_id = parent.id
    elsif child.is_a? PlanningElement
      child.parent_id = parent.id
    end

    child.save
  end
end

Given /^a relation between "(.*?)" and "(.*?)"$/ do |work_package_from, work_package_to|
  from = WorkPackage.find_by_subject(work_package_from)
  to = WorkPackage.find_by_subject(work_package_to)

  FactoryGirl.create :issue_relation, issue_from: from, issue_to: to
end

Given /^user is already watching "(.*?)"$/  do |work_package_subject|
  work_package = WorkPackage.find_by_subject(work_package_subject)
  user = User.find(page.get_rack_session["user_id"])

  work_package.add_watcher user
end
