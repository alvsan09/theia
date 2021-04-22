/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/**
 * Checks if the format of a given path represents a relative path within the base directory
 */
export function isRelativeToBaseDirectory(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return normalizedPath.startsWith('./');
}

/**
 * Push an item to an existing string array only if the item is not already included.
 * If the given array is undefined it creates a new one with the given item as the first entry.
 */
 export function pushIfNotIncluded(containerArray: string[] | undefined, item: string): string[] {
    if (!containerArray) {
        return [item];
    }

    if (!containerArray.includes(item)) {
        containerArray.push(item);
    }

    return containerArray;
}
